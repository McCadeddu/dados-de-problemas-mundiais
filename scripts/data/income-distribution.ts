import { INCOME_DISTRIBUTION, parseIncomeFootnote, type IncomeDistribution } from '../../src/lib/incomeDistribution.js'
import { fetchJsonWithRetry } from './http.js'

export type IncomeRow = { indicator: { id: string }; countryiso3code: string; country: { value: string }; date: string; value: number | null; obs_status: string; footnote: string }
type Envelope<T> = [{ page: number; pages: number; total: number; lastupdated?: string }, T[]]
type Metadata = { id: string; name: string; source: { id: string }; sourceNote: string; sourceOrganization: string }
export const incomeRequestUrl = (code: string) => `https://api.worldbank.org/v2/country/all/indicator/${code}?source=2&format=json&date=2000:2100&per_page=20000&footnote=y`
const metadataUrl = (code: string) => `https://api.worldbank.org/v2/indicator/${code}?source=2&format=json`

function complete<T>(raw: Envelope<T>) {
  if (!Array.isArray(raw) || raw[0]?.page !== 1 || raw[0]?.pages !== 1 || !Array.isArray(raw[1]) || raw[0].total !== raw[1].length) throw new Error('Distribuição: resposta incompleta')
  return raw[1]
}

export function parseIncomeDistribution(inputs: { code: string; raw: Envelope<IncomeRow>; metadata: Envelope<Metadata> }[], countries: { code: string; name: string }[], now: string): IncomeDistribution {
  if (inputs.length !== INCOME_DISTRIBUTION.length || new Set(inputs.map(i => i.code)).size !== inputs.length) throw new Error('Distribuição: indicadores ausentes ou duplicados')
  const countryMap = new Map(countries.map(c => [c.code, c.name]))
  const series: IncomeDistribution['series'] = []
  const indicators: IncomeDistribution['indicators'] = []
  const updates = new Set<string>()
  for (const definition of INCOME_DISTRIBUTION) {
    const input = inputs.find(i => i.code === definition.code)
    if (!input) throw new Error('Distribuição: indicador ausente')
    const meta = complete(input.metadata)[0]
    if (input.metadata[1].length !== 1 || meta?.id !== definition.code || meta.name !== definition.sourceName || meta.source?.id !== '2' || !/income or consumption/i.test(meta.sourceNote) || !meta.sourceOrganization?.trim()) throw new Error('Distribuição: definição alterada')
    const update = input.raw[0]?.lastupdated
    if (!update || !/^\d{4}-\d{2}-\d{2}$/.test(update)) throw new Error('Distribuição: atualização ausente')
    updates.add(update)
    const grouped = new Map<string, IncomeDistribution['series'][number]>()
    for (const row of complete(input.raw)) {
      if (row.indicator?.id !== definition.code) throw new Error('Distribuição: código inesperado')
      if (!countryMap.has(row.countryiso3code)) continue // Source aggregates do not define a joint distribution.
      if (!/^\d{4}$/.test(row.date) || Number(row.date) < 2000 || Number(row.date) > new Date(now).getUTCFullYear() || typeof row.obs_status !== 'string' || (row.value !== null && (typeof row.value !== 'number' || !Number.isFinite(row.value) || row.value < 0 || row.value > 100))) throw new Error('Distribuição: observação inválida')
      const entry = grouped.get(row.countryiso3code) ?? { indicatorId: definition.id, countryCode: row.countryiso3code, countryName: countryMap.get(row.countryiso3code)!, points: [] }
      if (entry.points.some(p => p.year === Number(row.date))) throw new Error('Distribuição: ano duplicado')
      if (typeof row.footnote !== 'string') throw new Error('Distribuição: nota por observação ausente')
      const sourceIncomeMetadata = parseIncomeFootnote(row.footnote)
      entry.points.push({ year: Number(row.date), value: row.value, status: row.obs_status, sourceFootnote: row.footnote,
        ...(sourceIncomeMetadata ? { sourceIncomeMetadata } : {}) })
      grouped.set(row.countryiso3code, entry)
    }
    if (grouped.size !== countryMap.size || ![...grouped.values()].some(s => s.points.some(p => p.value !== null))) throw new Error('Distribuição: cobertura incompleta')
    for (const entry of grouped.values()) {
      entry.points.sort((a, b) => a.year - b.year)
      if (entry.points.length < 20 || entry.points[0]?.year !== 2000 || entry.points.some((p, i) => i > 0 && p.year !== entry.points[i - 1].year + 1)) throw new Error('Distribuição: período omitido')
      series.push(entry)
    }
    indicators.push({ id: definition.id, code: definition.code, name: meta.name, sourceNote: meta.sourceNote, sourceOrganization: meta.sourceOrganization, requestUrl: incomeRequestUrl(definition.code), metadataUrl: metadataUrl(definition.code), methodologyUrl: `https://databank.worldbank.org/metadataglossary/world-development-indicators/series/${definition.code}` })
  }
  if (updates.size !== 1 || new Set(series.map(s => s.points.at(-1)?.year)).size !== 1) throw new Error('Distribuição: edições ou períodos diferentes')
  return { fetchedAt: now, lastAttemptAt: now, sourceUpdatedAt: [...updates][0], cached: false, licenseUrl: 'https://datacatalog.worldbank.org/int/public-licenses#cc-by', indicators, series }
}

export async function collectIncomeDistribution(countries: { code: string; name: string }[], previous?: IncomeDistribution, fetcher: typeof fetch = fetch): Promise<IncomeDistribution> {
  const now = new Date().toISOString()
  try {
    const inputs = await Promise.all(INCOME_DISTRIBUTION.map(async d => {
      const [raw, metadata] = await Promise.all([fetchJsonWithRetry<Envelope<IncomeRow>>(incomeRequestUrl(d.code), { fetcher }), fetchJsonWithRetry<Envelope<Metadata>>(metadataUrl(d.code), { fetcher })])
      return { code: d.code, raw, metadata }
    }))
    const next = parseIncomeDistribution(inputs, countries, now)
    if (previous?.series.some(old => old.points.some(p => p.value !== null && !next.series.find(s => s.indicatorId === old.indicatorId && s.countryCode === old.countryCode)?.points.some(n => n.year === p.year && n.value !== null)))) throw new Error('Distribuição: perda de cobertura')
    return next
  } catch (error) {
    if (!previous?.series.length || !INCOME_DISTRIBUTION.every(d => previous.indicators.some(i => i.code === d.code && i.id === d.id))) throw error
    console.warn(`Distribuição: mantendo coleta anterior: ${String(error)}`)
    return { ...previous, cached: true, lastAttemptAt: now }
  }
}

export function incomeDistributionCsv(data: IncomeDistribution) {
  const q = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`
  return '\ufeff' + [['indicador', 'codigo_fonte', 'pais', 'nome_pais', 'ano_pesquisa', 'valor', 'unidade', 'sinalizacao', 'atualizacao_base', 'coleta', 'ultima_tentativa', 'cache', 'consulta', 'metodologia', 'licenca', 'nota_wdi', 'pesquisa_wdi', 'conceito_wdi', 'tipo_distribuicao_wdi', 'restricao_cobertura_wdi'], ...data.series.flatMap(s => s.points.map(p => {
    const meta = data.indicators.find(i => i.id === s.indicatorId)!
    return [s.indicatorId, meta.code, s.countryCode, s.countryName, p.year, p.value, '% da renda ou consumo', p.status, data.sourceUpdatedAt, data.fetchedAt, data.lastAttemptAt, data.cached, meta.requestUrl, meta.methodologyUrl, data.licenseUrl,
      p.sourceFootnote, p.sourceIncomeMetadata?.surveyAcronym, p.sourceIncomeMetadata?.welfareType, p.sourceIncomeMetadata?.distributionType, p.sourceIncomeMetadata?.coverageRestriction]
  }))].map(row => row.map(q).join(',')).join('\r\n') + '\r\n'
}
