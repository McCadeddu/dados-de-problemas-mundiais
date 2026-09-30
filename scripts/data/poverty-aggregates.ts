import { POVERTY_REGIONS, type PovertyAggregates } from '../../src/lib/povertyAggregates.js'
import { fetchJsonWithRetry } from './http.js'
import { POVERTY_METADATA_URL, validatePovertyDefinition } from './poverty-definition.js'

export const POVERTY_DATA_URL = 'https://api.worldbank.org/v2/country/all/indicator/SI.POV.UMIC?source=2&format=json&date=2000:2100&per_page=20000'
export const POVERTY_GEOGRAPHY_URL = 'https://api.worldbank.org/v2/country?format=json&per_page=400'
type Envelope<T> = [{ page: number; pages: number; total: number; lastupdated?: string }, T[]]
export type PovertyRow = { indicator: { id: string }; countryiso3code: string; date: string; value: number | null; obs_status: string }
export type GeographyRow = { id: string; name: string; region: { id: string; value: string } }
function completeRows<T>(raw: Envelope<T>) {
  if (!Array.isArray(raw) || raw.length !== 2 || raw[0]?.page !== 1 || raw[0]?.pages !== 1 || !Array.isArray(raw[1]) || raw[0]?.total !== raw[1].length) throw new Error('Pobreza: resposta incompleta ou paginada')
  return raw[1]
}
export function parsePovertyAggregates(raw: Envelope<PovertyRow>, geographies: Envelope<GeographyRow>, metadata: unknown, now: string): PovertyAggregates {
  const meta = validatePovertyDefinition(metadata)
  const dataRows = completeRows(raw)
  const geoRows = completeRows(geographies)
  const aggregateCodes = new Set<string>(['WLD', ...POVERTY_REGIONS])
  const sourceUpdatedAt = raw[0].lastupdated
  if (!sourceUpdatedAt || !/^\d{4}-\d{2}-\d{2}$/.test(sourceUpdatedAt)) throw new Error('Pobreza: data de revisão ausente')
  const areas: PovertyAggregates['areas'] = geoRows.filter(g => g.region?.value !== 'Aggregates' || aggregateCodes.has(g.id)).map(g => {
    if (!g.region?.id || !g.region.value || !/^[A-Z0-9]{3}$/.test(g.id) || !g.name?.trim()) throw new Error('Pobreza: geografia inválida')
    if (aggregateCodes.has(g.id) && g.region.value !== 'Aggregates') throw new Error('Pobreza: agregado classificado como país')
    return { code: g.id, name: g.name, kind: g.id === 'WLD' ? 'world' : aggregateCodes.has(g.id) ? 'region' : 'country' }
  })
  if (new Set(areas.map(a => a.code)).size !== areas.length || [...aggregateCodes].some(code => !areas.some(a => a.code === code))) throw new Error('Pobreza: geografia duplicada ou região ausente')
  const series: PovertyAggregates['series'] = areas.map(a => ({ areaCode: a.code, points: [] }))
  const targets = new Map(series.map(s => [s.areaCode, s]))
  const seen = new Set<string>()
  for (const row of dataRows) {
    if (row.indicator?.id !== 'SI.POV.UMIC') throw new Error('Pobreza: indicador inesperado')
    const target = targets.get(row.countryiso3code)
    if (!target) continue // Income groups and overlapping aggregates are intentionally excluded.
    const key = `${row.countryiso3code}/${row.date}`
    if (seen.has(key) || !/^\d{4}$/.test(row.date) || Number(row.date) < 2000 || Number(row.date) > new Date(now).getUTCFullYear()
      || (row.value !== null && (typeof row.value !== 'number' || !Number.isFinite(row.value) || row.value < 0 || row.value > 100)) || typeof row.obs_status !== 'string') throw new Error('Pobreza: observação inválida ou duplicada')
    seen.add(key)
    target.points.push({ year: Number(row.date), value: row.value, status: row.obs_status })
  }
  for (const s of series) {
    s.points.sort((a, b) => a.year - b.year)
    if (s.points.length < 20 || s.points[0]?.year !== 2000 || s.points.some((p, i) => i > 0 && p.year !== s.points[i - 1].year + 1)) throw new Error('Pobreza: série incompleta')
  }
  if (new Set(series.map(s => s.points.at(-1)?.year)).size !== 1 || !series.find(s => s.areaCode === 'WLD')?.points.some(p => p.value !== null)) throw new Error('Pobreza: períodos omitidos ou mundo vazio')
  return { fetchedAt: now, lastAttemptAt: now, sourceUpdatedAt, cached: false, requestUrl: POVERTY_DATA_URL, geographyUrl: POVERTY_GEOGRAPHY_URL,
    metadataUrl: POVERTY_METADATA_URL, methodologyUrl: 'https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SI.POV.UMIC', licenseUrl: 'https://datacatalog.worldbank.org/int/public-licenses#cc-by',
    indicator: { code: 'SI.POV.UMIC', name: meta.name, sourceNote: meta.sourceNote, sourceOrganization: meta.sourceOrganization, povertyLine: 8.3, pppYear: 2021 }, areas, series }
}

export async function collectPovertyAggregates(previous?: PovertyAggregates, fetcher: typeof fetch = fetch): Promise<PovertyAggregates> {
  const now = new Date().toISOString()
  try {
    const [raw, geographies, metadata] = await Promise.all([
      fetchJsonWithRetry<Envelope<PovertyRow>>(POVERTY_DATA_URL, { fetcher }),
      fetchJsonWithRetry<Envelope<GeographyRow>>(POVERTY_GEOGRAPHY_URL, { fetcher }),
      fetchJsonWithRetry(POVERTY_METADATA_URL, { fetcher }),
    ])
    const result = parsePovertyAggregates(raw, geographies, metadata, now)
    if (previous?.series.some(old => old.points.some(p => p.value !== null && !result.series.find(s => s.areaCode === old.areaCode)?.points.some(n => n.year === p.year && n.value !== null)))) throw new Error('Pobreza: perda de cobertura; revisar antes de substituir')
    return result
  } catch (error) {
    if (!previous?.series.length || previous.indicator?.povertyLine !== 8.3 || previous.indicator?.pppYear !== 2021) throw error
    console.warn(`Pobreza: mantendo coleta de ${previous.fetchedAt}: ${String(error)}`)
    return { ...previous, cached: true, lastAttemptAt: now }
  }
}

export function povertyAggregatesCsv(data: PovertyAggregates) {
  const quote = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`
  return '\ufeff' + [['codigo_indicador', 'linha_dolar_dia', 'ano_ppc', 'area', 'nome_area', 'escala', 'ano', 'valor', 'unidade', 'sinalizacao', 'atualizacao_base', 'coleta', 'ultima_tentativa', 'cache', 'consulta', 'metodologia', 'licenca'],
    ...data.series.flatMap(s => s.points.map(p => {
      const area = data.areas.find(a => a.code === s.areaCode)!
      return [data.indicator.code, data.indicator.povertyLine, data.indicator.pppYear, area.code, area.name, area.kind, p.year, p.value, '% da população', p.status, data.sourceUpdatedAt, data.fetchedAt, data.lastAttemptAt, data.cached, data.requestUrl, data.methodologyUrl, data.licenseUrl]
    }))].map(r => r.map(quote).join(',')).join('\r\n') + '\r\n'
}
