import { HUNGER_AGGREGATE_INDICATORS as indicators, HUNGER_AREAS, type HungerAggregates } from '../../src/lib/hungerAggregates.js'
import { fetchJsonWithRetry } from './http.js'

type Envelope<T> = [{ page: number; pages: number; total: number; lastupdated?: string }, T[]]
export type AggregateRow = { indicator: { id: string }; countryiso3code: string; date: string; value: number | null; obs_status: string }
export type AreaRow = { id: string; name: string; region: { id: string; value: string } }
export type MetadataRow = { id: string; name: string; source: { id: string }; sourceNote: string; sourceOrganization: string }
export const AREA_URL = `https://api.worldbank.org/v2/country/${HUNGER_AREAS.join(';')}?format=json&per_page=100`
export const DATA_URL = `https://api.worldbank.org/v2/country/${HUNGER_AREAS.join(';')}/indicator/${indicators.map(i => i.code).join(';')}?source=2&format=json&date=2000:2100&per_page=20000`

function rows<T>(raw: Envelope<T>): T[] {
  if (!Array.isArray(raw) || raw.length !== 2 || raw[0]?.page !== 1 || raw[0]?.pages !== 1
    || !Array.isArray(raw[1]) || raw[1].length !== raw[0].total) throw new Error('Banco Mundial: resposta incompleta ou paginada')
  return raw[1]
}

export function parseHungerAggregates(raw: Envelope<AggregateRow>, areaRaw: Envelope<AreaRow>, metadata: Envelope<MetadataRow>[], now: string): HungerAggregates {
  const sourceUpdatedAt = raw[0]?.lastupdated
  if (!sourceUpdatedAt || !/^\d{4}-\d{2}-\d{2}$/.test(sourceUpdatedAt)) throw new Error('Banco Mundial: revisão ausente')
  const areas = rows(areaRaw)
  if (areas.length !== HUNGER_AREAS.length || new Set(areas.map(a => a.id)).size !== areas.length
    || areas.some(a => !HUNGER_AREAS.some(code => code === a.id) || !a.name?.trim() || a.region?.id !== 'NA' || a.region.value !== 'Aggregates')) throw new Error('Banco Mundial: regiões inesperadas')
  if (metadata.length !== indicators.length) throw new Error('Banco Mundial: metadados incompletos')
  const definitions = indicators.map((indicator, i) => {
    const metaRows = rows(metadata[i]); const meta = metaRows[0]
    if (metaRows.length !== 1 || meta.id !== indicator.code || meta.source?.id !== '2' || !meta.name?.includes('%') || !meta.sourceNote?.trim() || !meta.sourceOrganization?.trim()) throw new Error('Banco Mundial: definição incompatível')
    return { id: indicator.id, code: indicator.code, sourceName: meta.name, sourceNote: meta.sourceNote, sourceOrganization: meta.sourceOrganization,
      metadataUrl: `https://api.worldbank.org/v2/indicator/${indicator.code}?source=2&format=json`, methodologyUrl: `https://databank.worldbank.org/metadataglossary/world-development-indicators/series/${indicator.code}` }
  })
  const series = indicators.flatMap(i => HUNGER_AREAS.map(code => ({ indicatorId: i.id, areaCode: code as string, points: [] as HungerAggregates['series'][number]['points'] })))
  const seen = new Set<string>()
  for (const row of rows(raw)) {
    const indicator = indicators.find(i => i.code === row.indicator?.id)
    const target = series.find(s => s.indicatorId === indicator?.id && s.areaCode === row.countryiso3code)
    const key = `${row.indicator?.id}/${row.countryiso3code}/${row.date}`
    if (!target || seen.has(key) || !/^\d{4}$/.test(row.date) || Number(row.date) < 2000 || Number(row.date) > new Date(now).getUTCFullYear()
      || (row.value !== null && (typeof row.value !== 'number' || !Number.isFinite(row.value) || row.value < 0 || row.value > 100))
      || typeof row.obs_status !== 'string') throw new Error('Banco Mundial: observação inválida ou duplicada')
    seen.add(key)
    target.points.push({ year: Number(row.date), value: row.value, status: row.obs_status })
  }
  for (const s of series) {
    s.points.sort((a, b) => a.year - b.year)
    if (s.points.length < 20 || s.points[0].year !== 2000 || s.points.some((p, i) => i > 0 && p.year !== s.points[i - 1].year + 1)
      || (s.areaCode === 'WLD' && s.points.filter(p => p.value !== null).length < 5)) throw new Error('Banco Mundial: série incompleta')
  }
  if (new Set(series.map(s => s.points.at(-1)!.year)).size !== 1) throw new Error('Banco Mundial: períodos omitidos')
  return { fetchedAt: now, lastAttemptAt: now, sourceUpdatedAt, cached: false, requestUrl: DATA_URL, areaRequestUrl: AREA_URL,
    licenseUrl: 'https://datacatalog.worldbank.org/int/public-licenses#cc-by', areas: areas.map(a => ({ code: a.id, name: a.name.trim() })), indicators: definitions, series }
}

export async function collectHungerAggregates(previous?: HungerAggregates, fetcher: typeof fetch = fetch): Promise<HungerAggregates> {
  const now = new Date().toISOString()
  try {
    const [data, areas, ...metadata] = await Promise.all([
      fetchJsonWithRetry<Envelope<AggregateRow>>(DATA_URL, { fetcher }),
      fetchJsonWithRetry<Envelope<AreaRow>>(AREA_URL, { fetcher }),
      ...indicators.map(i => fetchJsonWithRetry<Envelope<MetadataRow>>(`https://api.worldbank.org/v2/indicator/${i.code}?source=2&format=json`, { fetcher })),
    ])
    const result = parseHungerAggregates(data as Envelope<AggregateRow>, areas as Envelope<AreaRow>, metadata as Envelope<MetadataRow>[], now)
    if (previous && previous.series.some(old => {
      const current = result.series.find(s => s.indicatorId === old.indicatorId && s.areaCode === old.areaCode)
      return !current || old.points.some(p => p.value !== null && !current.points.some(n => n.year === p.year && n.value !== null))
    })) throw new Error('Banco Mundial: perda de cobertura; revisar antes de substituir')
    return result
  } catch (error) {
    if (!previous?.series.length) throw error
    console.warn(`Agregados de fome e água: mantendo coleta de ${previous.fetchedAt}: ${String(error)}`)
    return { ...previous, cached: true, lastAttemptAt: now }
  }
}

export function hungerAggregatesCsv(data: HungerAggregates) {
  const quote = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`
  return '\ufeff' + [['indicador', 'codigo_fonte', 'area', 'nome_area_fonte', 'ano_fonte', 'valor', 'unidade', 'sinalizacao', 'organizacao_fonte', 'definicao_fonte', 'atualizacao_base', 'coleta', 'ultima_tentativa', 'coleta_anterior', 'consulta', 'metodologia', 'licenca'],
    ...data.series.flatMap(s => s.points.map(p => {
      const meta = data.indicators.find(i => i.id === s.indicatorId)!
      return [s.indicatorId, meta.code, s.areaCode, data.areas.find(a => a.code === s.areaCode)!.name, p.year, p.value, '% da população', p.status, meta.sourceOrganization, meta.sourceNote, data.sourceUpdatedAt, data.fetchedAt, data.lastAttemptAt, data.cached, data.requestUrl, meta.methodologyUrl, data.licenseUrl]
    }))].map(r => r.map(quote).join(',')).join('\r\n') + '\r\n'
}
