import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import type { DashboardData } from '../../src/types.js'
import { fetchJsonWithRetry, fetchTextWithRetry } from './http.js'
import { ILO_BASE, ILO_QUERIES, normalizeIlo, parseIloCsv, STATUS_LABELS } from './ilo-observations.js'

const base = 'public/data/'
const data = JSON.parse(await readFile(base + 'mundialidade.json', 'utf8')) as DashboardData
const countries = new Map(data.countries.map(c => [c.code, c.name]))
const lastYear = Math.min(new Date().getUTCFullYear() - 1, ...['ilo-unemployment', 'ilo-vulnerable-employment'].map(id => data.indicators.find(i => i.id === id)?.latestYear ?? 2025))
const fetchedAt = new Date().toISOString()
const metadataOptions = { acceptLanguage: 'en', accept: 'application/vnd.sdmx.structure+json;version=1.0' }
const statusUrl = `${ILO_BASE}/codelist/ILO/CL_OBS_STATUS/1.0`
const statusMetadata = await fetchJsonWithRetry<{ data: { codelists: Array<{ id: string; codes: Array<{ id: string; name: string }> }> } }>(statusUrl, metadataOptions)
const statusLabels = Object.fromEntries((statusMetadata.data?.codelists?.find(c => c.id === 'CL_OBS_STATUS')?.codes ?? []).map(c => [c.id, c.name]))
for (const [code, label] of Object.entries(STATUS_LABELS)) if (statusLabels[code] !== label) throw new Error(`Código OIT não confirmado: ${code}`)
type FlowMetadata = { data: { dataflows: Array<{ id: string; name: string; annotations: Array<{ type: string; title: string }> }> } }
const artifacts = await Promise.all((Object.keys(ILO_QUERIES) as Array<keyof typeof ILO_QUERIES>).map(async kind => {
  const flowId = kind === 'unemployment' ? 'DF_UNE_2EAP_SEX_AGE_RT' : 'DF_EMP_2EMP_SEX_STE_NB'
  const metadataUrl = `${ILO_BASE}/dataflow/ILO/${flowId}/1.0`
  const flowMetadata = await fetchJsonWithRetry<FlowMetadata>(metadataUrl, metadataOptions)
  const flow = flowMetadata.data?.dataflows?.find(f => f.id === flowId)
  if (!flow?.name.includes('ILO modelled estimates')) throw new Error(`Metadados OIT inesperados: ${flowId}`)
  const requestUrl = `${ILO_BASE}${ILO_QUERIES[kind]}?startPeriod=1991&endPeriod=${lastYear}&format=csv`
  const csv = await fetchTextWithRetry(requestUrl, { acceptLanguage: 'en' })
  const rows = parseIloCsv(csv, kind)
  const series = normalizeIlo(rows, kind, countries, lastYear)
  // A tiny, valid CSV can still be an incomplete global response.
  if (series.length < 150) throw new Error(`Cobertura OIT inesperadamente reduzida: ${kind}/${series.length}`)
  const flags: Record<string, number> = {}
  for (const row of rows.filter(r => countries.has(r.REF_AREA))) flags[row.OBS_STATUS || '(vazio)'] = (flags[row.OBS_STATUS || '(vazio)'] ?? 0) + 1
  const points = series.flatMap(s => s.points)
  return { kind, csv, series, metadata: { indicatorId: series[0].indicatorId, requestUrl, metadataUrl, sourceEdition: flow.name,
    sourceLastUpdate: flow.annotations?.find(a => a.type === 'LAST_UPDATE')?.title,
    sourceUpdatedAt: flow.annotations?.find(a => a.type === 'LAST_UPDATE')?.title.replace(/^(\d{2})\/(\d{2})\/(\d{4}).*$/, '$3-$2-$1'),
    file: `ilo-${kind}-observations.csv`,
    sha256: createHash('sha256').update(csv).digest('hex'), countries: series.length, observations: points.length,
    firstYear: Math.min(...points.map(p => p.year)), lastYear: Math.max(...points.map(p => p.year)),
    reported: points.filter(p => p.observationType === 'reported').length,
    imputed: points.filter(p => p.observationType === 'imputed').length,
    unknown: points.filter(p => p.observationType === 'unknown').length, componentFlags: flags } }
}))
// Validate both inputs before updating any public series. Failures stop publication instead of certifying stale classifications.
for (const artifact of artifacts) {
  const id = artifact.metadata.indicatorId
  const indicator = data.indicators.find(i => i.id === id)!
  indicator.latestYear = artifact.metadata.lastYear
  indicator.description = artifact.kind === 'unemployment'
    ? 'Desemprego das pessoas de 15 anos ou mais como percentual da força de trabalho. Estimativa modelada OIT consultada diretamente na API SDMX; o status de cada observação é preservado. Valor real (R) é distinguido de imputação (I), ajuste e status ausente.'
    : 'Percentual de trabalhadores por conta própria e familiares auxiliares no emprego total. Calculado dos três componentes ICSE-93 da OIT/SDMX: 100 × (conta própria + familiar auxiliar) / emprego total. Os componentes são publicados em milhares com arredondamento; o valor pode diferir ligeiramente do Banco Mundial. Ajuste ou status vazio não comprovam observação reportada.'
  const source = data.sources.find(s => s.id === indicator.sourceId)!
  source.name = 'OIT/ILOSTAT — API SDMX direta'
  source.url = artifact.metadata.requestUrl
  source.methodologyUrl = artifact.metadata.metadataUrl
  source.lastUpdated = artifact.metadata.sourceEdition
  source.license = 'Dados públicos OIT/ILOSTAT; citar fonte e cálculo'
  const latest = artifact.series.map(s => ({ indicatorId: id, geographyType: s.geographyType, geographyCode: s.geographyCode, geographyName: s.geographyName, ...s.points.at(-1)! }))
  data.latest = [...data.latest.filter(p => p.indicatorId !== id), ...latest]
  data.rankings = [...data.rankings.filter(r => r.indicatorId !== id), { indicatorId: id, geographyType: 'country', year: indicator.latestYear, items: [...latest].sort((a, b) => b.value - a.value) }]
  await writeFile(base + artifact.metadata.file, artifact.csv)
  await writeFile(`${base}series/${id}.json`, JSON.stringify(artifact.series))
  console.log(`${id}: ${artifact.metadata.observations} observações; ${artifact.metadata.reported} com R; ${artifact.metadata.unknown} sem classificação reportada comprovada`)
}
data.generatedAt = new Date().toISOString()
await writeFile(base + 'mundialidade.json', JSON.stringify(data))
try {
  const coverage = JSON.parse(await readFile(base + 'country-coverage.json', 'utf8')) as { generatedAt: string; catalogGeneratedAt?: string; countries: Array<{ countryCode: string; indicators: Array<{ indicatorId: string; year: number | null; hasData: boolean }> }> }
  for (const country of coverage.countries) for (const indicator of country.indicators) {
    if (!artifacts.some(a => a.metadata.indicatorId === indicator.indicatorId)) continue
    const latest = data.latest.find(p => p.indicatorId === indicator.indicatorId && p.geographyCode === country.countryCode)
    indicator.year = latest?.year ?? null; indicator.hasData = !!latest
  }
  coverage.catalogGeneratedAt = data.generatedAt
  await writeFile(base + 'country-coverage.json', JSON.stringify(coverage))
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
}
await writeFile(base + 'ilo-observation-audit.json', JSON.stringify({ fetchedAt, lastAttemptAt: fetchedAt, cached: false,
  catalogGeneratedAt: data.generatedAt,
  statusUrl, statusLabels,
  datasets: artifacts.map(a => a.metadata) }))
