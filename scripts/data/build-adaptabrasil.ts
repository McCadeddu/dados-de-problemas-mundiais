import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fetchJsonWithRetry } from './http.js'
import { ADAPTA_BASE, ADAPTA_INDICATOR, ADAPTA_SCHEMA, parseAdaptaData, type AdaptaData, type AdaptaSnapshot } from '../../src/lib/adaptabrasil.js'
import { ADAPTA_SELECTIONS, adaptaRequestUrl, normalizeAdaptaRows, validateAdaptaHierarchy, type AdaptaHierarchyItem, type RawAdaptaRow, type StateCrosswalk } from './adaptabrasil.js'

const hierarchyUrl = `${ADAPTA_BASE}/api/hierarquia/${ADAPTA_SCHEMA}`
const lastAttemptAt = new Date().toISOString()
const crosswalk = JSON.parse(await readFile('scripts/data/sources/ibge-states-2026-10-15.json', 'utf8')) as StateCrosswalk
const hierarchy = await fetchJsonWithRetry<AdaptaHierarchyItem[]>(hierarchyUrl)
const { indicator, sector, legend } = validateAdaptaHierarchy(hierarchy)
const responses = await Promise.all(ADAPTA_SELECTIONS.map(async ({ year, scenario }) => {
  const requestUrl = adaptaRequestUrl(year, scenario)
  const rows = await fetchJsonWithRetry<RawAdaptaRow[]>(requestUrl)
  return { year, scenario, requestUrl, rows, states: normalizeAdaptaRows(rows, year, scenario, crosswalk, legend) }
}))
const after = validateAdaptaHierarchy(await fetchJsonWithRetry<AdaptaHierarchyItem[]>(hierarchyUrl))
if (JSON.stringify([indicator, sector]) !== JSON.stringify([after.indicator, after.sector])) throw new Error('Metadados AdaptaBrasil mudaram durante a coleta')
const snapshots: AdaptaSnapshot[] = responses.map(r => {
  const period = sector.years_description!.find(y => y.year === r.year)!
  const scenario = sector.scenarios!.find(s => s.value === r.scenario)
  return { key: `${r.year}-${r.scenario ?? 'present'}`, year: r.year, yearLabel: period.label,
    period: period.description, scenarioId: r.scenario, scenarioLabel: scenario?.label ?? 'Referência sem cenário futuro',
    scenarioDescription: scenario?.description.replaceAll('\\n', ' ').trim() ?? '', requestUrl: r.requestUrl,
    portalUrl: `${ADAPTA_BASE}/${ADAPTA_INDICATOR}/1/${r.year}/${r.scenario}/BR/estado/${ADAPTA_SCHEMA}`, states: r.states }
})
const warnings = new Map<string, AdaptaData['crosswalkWarnings'][number]>()
for (const s of snapshots.flatMap(s => s.states)) if (s.code !== s.sourceCode) warnings.set(s.abbreviation, { abbreviation: s.abbreviation, sourceCode: s.sourceCode, ibgeCode: s.code })
const raw = JSON.stringify({ hierarchyUrl, metadata: [sector, indicator], crosswalk, responses: responses.map(({ year, scenario, requestUrl, rows }) => ({ year, scenario, requestUrl, rows })) })
const result: AdaptaData = { fetchedAt: new Date().toISOString(), lastAttemptAt, cached: false, indicatorId: ADAPTA_INDICATOR,
  indicatorName: indicator.name, definition: indicator.simple_description, sector: sector.name, scale: [0, 1], legend,
  snapshots, hierarchyUrl, sourceFile: 'adaptabrasil-source.json', sourceSha256: createHash('sha256').update(raw).digest('hex'),
  crosswalkSourceUrl: crosswalk.sourceUrl, crosswalkReviewedAt: crosswalk.reviewedAt, crosswalkWarnings: [...warnings.values()] }
parseAdaptaData(result)
await writeFile('public/data/adaptabrasil-source.json', raw)
await writeFile('public/data/adaptabrasil.json', JSON.stringify(result))
console.log(`AdaptaBrasil: ${snapshots.length} recortes oficiais por UF, ${snapshots.reduce((n, s) => n + s.states.filter(s => s.value !== null).length, 0)} índices; ${warnings.size} correspondência(s) territorial(is) documentada(s).`)
