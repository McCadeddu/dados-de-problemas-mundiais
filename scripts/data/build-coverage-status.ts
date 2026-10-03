import { readFile, writeFile } from 'node:fs/promises'
import type { DashboardData, ThemeId } from '../../src/types.js'
import { observedCoverage, type CoverageDataset, type CoverageScope } from '../../src/lib/coverageStatus.js'

type Artifact = Record<string, unknown>
const base = 'public/data/'
async function readArtifact(file: string): Promise<Artifact | undefined> {
  try { return JSON.parse(await readFile(base + file, 'utf8')) as Artifact }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined; throw error }
}
const catalog = await readArtifact('mundialidade.json') as unknown as DashboardData
if (!catalog?.indicators || !catalog.generatedAt) throw new Error('Catálogo principal indisponível')
const datasets: CoverageDataset[] = []
function dates(a: Artifact = {}) {
  const date = (key: string) => typeof a[key] === 'string' ? a[key] as string : undefined
  return { fetchedAt: date('fetchedAt'), lastAttemptAt: date('lastAttemptAt'),
    sourceUpdatedAt: date('sourceUpdatedAt') ?? date('publishedAt'), reviewedAt: date('reviewedAt'),
    cached: typeof a.cached === 'boolean' ? a.cached : undefined }
}
const metadataFiles: Record<string, string> = {
  'ilo-unemployment': 'ilo-observation-audit.json', 'ilo-vulnerable-employment': 'ilo-observation-audit.json',
  'wb-income-top-10': 'income-distribution.json', 'wb-income-bottom-20': 'income-distribution.json',
  'ibge-state-food-insecurity': 'brazil-food-security-states.json',
  'ibge-state-food-insecurity-moderate': 'brazil-food-security-states.json',
  'ibge-state-food-insecurity-severe': 'brazil-food-security-states.json',
  'raseam-state-feminicide-rate': 'brazil-feminicide.json', 'raseam-state-feminicide-victims': 'brazil-feminicide.json',
}
for (const indicator of catalog.indicators) {
  const file = `series/${indicator.id}.json`
  // Series files are arrays rather than metadata objects.
  const series = await readArtifact(file) as unknown as DashboardData['series'] | undefined
  let metadata = metadataFiles[indicator.id] ? await readArtifact(metadataFiles[indicator.id]) : undefined
  if (metadataFiles[indicator.id] === 'ilo-observation-audit.json') {
    const dataset = (metadata?.datasets as Artifact[] | undefined)?.find(d => d.indicatorId === indicator.id)
    metadata = { ...metadata, sourceUpdatedAt: dataset?.sourceUpdatedAt }
  }
  datasets.push({ id: indicator.id, name: indicator.name, themeId: indicator.themeId,
    scope: indicator.geographyType as CoverageScope, file, available: !!series,
    ...observedCoverage((series ?? []).map(s => ({ code: s.geographyCode, points: s.points }))),
    sourceUrl: catalog.sources.find(s => s.id === indicator.sourceId)?.url,
    processedAt: catalog.generatedAt, ...dates(metadata) })
}

type AggregateSeries = { indicatorId?: string; areaCode: string; points: Array<{ year: number; value: unknown }> }
for (const [file, themeId, fallbackId] of [
  ['hunger-aggregates.json', 'hunger-water', 'hunger'],
  ['poverty-aggregates.json', 'poverty-inequality', 'wb-poverty-685'],
] as const) {
  const artifact = await readArtifact(file)
  const series = (artifact?.series ?? []) as AggregateSeries[]
  const areas = (artifact?.areas ?? []) as Array<{ code: string; kind?: string }>
  const countryCodes = new Set(areas.filter(a => a.kind === 'country').map(a => a.code))
  const ids = [...new Set(series.map(s => s.indicatorId ?? fallbackId))]
  for (const scope of ['world', 'source-regions'] as const) for (const id of ids.length ? ids : [fallbackId]) {
    const rows = series.filter(s => (s.indicatorId ?? fallbackId) === id && (scope === 'world'
      ? s.areaCode === 'WLD' : s.areaCode !== 'WLD' && !countryCodes.has(s.areaCode)))
    datasets.push({ id: `${id}-${scope}`, name: `${catalog.indicators.find(i => i.id === id)?.name ?? id} — agregado oficial`,
      themeId, scope, file, available: !!artifact, ...dates(artifact),
      ...observedCoverage(rows.map(s => ({ code: s.areaCode, points: s.points }))),
      sourceUrl: typeof artifact?.methodologyUrl === 'string' ? artifact.methodologyUrl : catalog.sources.find(s => s.id === catalog.indicators.find(i => i.id === id)?.sourceId)?.url })
  }
}
const forced = await readArtifact('forced-labour-2021.json')
for (const scope of ['world', 'source-regions'] as const) {
  const rows = scope === 'world' ? [{ code: 'WLD', value: (forced?.world as Artifact | undefined)?.countThousands }]
    : ((forced?.regions ?? []) as Array<{ id: string; countThousands: number }>).map(r => ({ code: r.id, value: r.countThousands }))
  datasets.push({ id: `forced-labour-${scope}`, name: 'Trabalho forçado — estimativa oficial', themeId: 'decent-work',
    scope, file: 'forced-labour-2021.json', available: !!forced, ...dates(forced),
    sourceUrl: forced?.documentUrl as string | undefined,
    ...observedCoverage(rows.map(r => ({ code: r.code, points: [{ year: forced?.referenceYear as number, value: r.value }] }))) })
}
const national = await readArtifact('national-data.json')
const nationalDefinitions: Array<[string, string, ThemeId, string]> = [
  ['poverty', 'Pobreza relativa — Eurostat', 'poverty-inequality', ''],
  ['brazilFoodSecurity', 'Segurança alimentar — IBGE', 'hunger-water', 'BRA'],
  ['australiaUnemployment', 'Desemprego — ABS', 'decent-work', 'AUS'],
  ['portugalUnemployment', 'Desemprego — INE Portugal', 'decent-work', 'PRT'],
  ['portugalBenefits', 'Subsídios de desemprego — INE Portugal', 'decent-work', 'PRT'],
  ['italyUnemployment', 'Desemprego — Istat', 'decent-work', 'ITA'],
  ['mexicoUnemployment', 'Desemprego — INEGI', 'decent-work', 'MEX'],
  ['southAfricaUnemployment', 'Desemprego — Stats SA', 'decent-work', 'ZAF'],
  ['southAfricaPension', 'Contribuição patronal — Stats SA', 'decent-work', 'ZAF'],
  ['indiaUnemployment', 'Desemprego — MoSPI', 'decent-work', 'IND'],
]
for (const [key, name, themeId, country] of nationalDefinitions) {
  const artifact = national?.[key] as Artifact | undefined
  const series = key === 'poverty' ? (artifact?.series ?? []) as Array<{ countryCode: string; points: Array<{ year: number; value: number }> }> : []
  const points = (artifact?.points ?? []) as Array<{ year?: number; period?: string; value?: unknown; foodInsecurity?: number; bothSexes?: number }>
  datasets.push({ id: key, name, themeId, scope: 'national', file: 'national-data.json', available: !!artifact,
    ...dates(artifact), processedAt: national?.generatedAt as string | undefined, sourceUrl: artifact?.sourceUrl as string | undefined,
    ...observedCoverage(key === 'poverty' ? series.map(s => ({ code: s.countryCode, points: s.points }))
      : [{ code: country, points: points.map(p => ({ ...p, value: p.value ?? p.foodInsecurity ?? p.bothSexes })) }]) })
}
await writeFile(base + 'coverage-status.json', JSON.stringify({ generatedAt: new Date().toISOString(), catalogGeneratedAt: catalog.generatedAt, datasets }))
console.log(`Cobertura e status: ${datasets.length} conjuntos; ${datasets.filter(d => d.cached).length} usam cache declarado.`)
