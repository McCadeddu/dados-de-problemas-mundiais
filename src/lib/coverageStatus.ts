import type { ThemeId } from '../types.js'

export type CoverageScope = 'world' | 'source-regions' | 'country' | 'national' | 'brazil-state' | 'brazil-immediate-region'
export const COVERAGE_SCOPES: Array<{ id: CoverageScope; name: string }> = [
  { id: 'world', name: 'Mundo: agregados oficiais' },
  { id: 'source-regions', name: 'Regiões oficiais da fonte' },
  { id: 'country', name: 'Países: séries internacionais' },
  { id: 'national', name: 'Complementos nacionais' },
  { id: 'brazil-state', name: 'UFs brasileiras' },
  { id: 'brazil-immediate-region', name: 'Regiões IBGE' },
]

export type CoverageDataset = {
  id: string; name: string; themeId: ThemeId; scope: CoverageScope
  file: string; sourceUrl?: string; available: boolean; territories: string[]
  firstPeriod?: string; lastPeriod?: string
  fetchedAt?: string; lastAttemptAt?: string; sourceUpdatedAt?: string
  reviewedAt?: string; processedAt?: string; cached?: boolean
}
export type CoverageReport = {
  generatedAt: string; catalogGeneratedAt: string; datasets: CoverageDataset[]
}

export function collectionStatus(dataset: CoverageDataset) {
  if (!dataset.available) return 'Arquivo indisponível'
  if (dataset.cached === true) return 'Coleta anterior (cache)'
  if (dataset.fetchedAt) return 'Coleta registrada'
  if (dataset.reviewedAt) return 'Revisão documental registrada'
  return 'Data de coleta não informada'
}

export function scopeCoverage(datasets: CoverageDataset[], themeId: ThemeId, scope: CoverageScope) {
  const registered = datasets.filter(d => d.themeId === themeId && d.scope === scope)
  const integrated = registered.filter(d => d.available && d.territories.length > 0)
  return { datasets: integrated.length, registered: registered.length,
    territories: new Set(integrated.flatMap(d => d.territories)).size }
}

/** Zero is an observation; null and nonfinite values are not. */
export function observedCoverage(series: Array<{ code: string; points: Array<{ year?: number; period?: string; value: unknown }> }>) {
  const territories = new Set<string>()
  const periods: string[] = []
  for (const s of series) for (const p of s.points) {
    const period = p.period ?? (Number.isInteger(p.year) ? String(p.year) : undefined)
    if (typeof p.value !== 'number' || !Number.isFinite(p.value) || !period) continue
    territories.add(s.code); periods.push(period)
  }
  periods.sort()
  return { territories: [...territories].sort(), firstPeriod: periods[0], lastPeriod: periods.at(-1) }
}
