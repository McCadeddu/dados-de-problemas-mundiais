import type { DashboardData, DataPoint } from '../types'

export const migrationMeasures = {
  refugees: { id: 'unhcr-refugees-hosted', title: 'Refugiados acolhidos' },
  asylum: { id: 'unhcr-asylum-seekers-hosted', title: 'Solicitantes de asilo acolhidos' },
  stock: { id: 'wb-migrant-stock', title: 'Estoque internacional de migrantes' },
} as const
export type MigrationMeasure = keyof typeof migrationMeasures
export type AlignedRow = {
  countryCode: string
  countryName: string
  continent: string
  year: number
  unemployment: number
  vulnerableEmployment: number
  population: number
  migrationCount: number
  migrationPerThousand: number
}

export type ChangeRow = {
  countryCode: string
  countryName: string
  continent: string
  year: number
  previousYear: number
  deltaUnemployment: number
  deltaVulnerableEmployment: number
  deltaMigrationPerThousand: number
}

function pointMap(points: DataPoint[]) {
  return new Map(points.map((point) => [point.year, point.value]))
}

/** Exact country/year intersection; no interpolation or latest-year substitution. */
export function alignWorkMigration(data: DashboardData, migrationId: string): AlignedRow[] {
  const index = (id: string) => new Map(data.series
    .filter((series) => series.indicatorId === id && series.geographyType === 'country')
    .map((series) => [series.geographyCode, pointMap(series.points)]))
  const unemployment = index('ilo-unemployment')
  const vulnerable = index('ilo-vulnerable-employment')
  const migration = index(migrationId)
  const population = new Map(data.countryPopulation.map((series) => [series.geographyCode, pointMap(series.points)]))
  const rows: AlignedRow[] = []
  for (const country of data.countries) {
    for (const [year, u] of unemployment.get(country.code) ?? []) {
      const v = vulnerable.get(country.code)?.get(year)
      const m = migration.get(country.code)?.get(year)
      const p = population.get(country.code)?.get(year)
      if (!Number.isInteger(year) || !Number.isFinite(u) || u < 0 || u > 100
        || v === undefined || !Number.isFinite(v) || v < 0 || v > 100
        || m === undefined || !Number.isFinite(m) || m < 0
        || p === undefined || !Number.isFinite(p) || p <= 0) continue
      const rate = (m / p) * 1000
      if (!Number.isFinite(rate)) continue
      rows.push({ countryCode: country.code, countryName: country.name, continent: country.continent,
        year, unemployment: u, vulnerableEmployment: v, population: p,
        migrationCount: m, migrationPerThousand: rate })
    }
  }
  return rows.sort((a, b) => b.year - a.year || a.countryCode.localeCompare(b.countryCode))
}

/** One country per row in one year; Pearson r, unweighted, without inference. */
function pearsonValues(valuesX: number[], valuesY: number[]): number | null {
  if (valuesX.length < 3 || valuesX.length !== valuesY.length) return null
  const meanX = valuesX.reduce((sum, value) => sum + value, 0) / valuesX.length
  const meanY = valuesY.reduce((sum, value) => sum + value, 0) / valuesY.length
  let cross = 0
  let squaredX = 0
  let squaredY = 0
  for (let index = 0; index < valuesX.length; index += 1) {
    const x = valuesX[index] - meanX
    const y = valuesY[index] - meanY
    cross += x * y
    squaredX += x * x
    squaredY += y * y
  }
  const denominator = Math.sqrt(squaredX) * Math.sqrt(squaredY)
  if (!Number.isFinite(denominator) || denominator === 0) return null
  const value = cross / denominator
  return Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : null
}

export function pearson(rows: AlignedRow[], measure: 'unemployment' | 'vulnerableEmployment'): number | null {
  return pearsonValues(rows.map((row) => row[measure]), rows.map((row) => row.migrationPerThousand))
}

function averageRanks(values: number[]) {
  const sorted = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value)
  const ranks = Array.from({ length: values.length }, () => 0)
  let start = 0
  while (start < sorted.length) {
    let end = start + 1
    while (end < sorted.length && sorted[end].value === sorted[start].value) end += 1
    const rank = (start + 1 + end) / 2
    for (let index = start; index < end; index += 1) ranks[sorted[index].index] = rank
    start = end
  }
  return ranks
}

/** Rank correlation for monotonic association; ties receive their average rank. */
export function spearman(rows: AlignedRow[], measure: 'unemployment' | 'vulnerableEmployment'): number | null {
  if (rows.length < 3) return null
  const x = averageRanks(rows.map((row) => row[measure]))
  const y = averageRanks(rows.map((row) => row.migrationPerThousand))
  const meanX = x.reduce((sum, value) => sum + value, 0) / x.length
  const meanY = y.reduce((sum, value) => sum + value, 0) / y.length
  let cross = 0
  let squaredX = 0
  let squaredY = 0
  for (let index = 0; index < x.length; index += 1) {
    const centeredX = x[index] - meanX
    const centeredY = y[index] - meanY
    cross += centeredX * centeredY
    squaredX += centeredX * centeredX
    squaredY += centeredY * centeredY
  }
  const denominator = Math.sqrt(squaredX) * Math.sqrt(squaredY)
  if (!Number.isFinite(denominator) || denominator === 0) return null
  const value = cross / denominator
  return Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : null
}

function spearmanValues(valuesX: number[], valuesY: number[]) {
  if (valuesX.length !== valuesY.length) return null
  return pearsonValues(averageRanks(valuesX), averageRanks(valuesY))
}

export function pearsonChanges(rows: ChangeRow[], measure: 'deltaUnemployment' | 'deltaVulnerableEmployment'): number | null {
  return pearsonValues(rows.map((row) => row[measure]), rows.map((row) => row.deltaMigrationPerThousand))
}

export function spearmanChanges(rows: ChangeRow[], measure: 'deltaUnemployment' | 'deltaVulnerableEmployment'): number | null {
  return spearmanValues(rows.map((row) => row[measure]), rows.map((row) => row.deltaMigrationPerThousand))
}

/** Population-weighted Pearson sensitivity; it answers a different question from the country-weighted result. */
export function weightedPearson(rows: AlignedRow[], measure: 'unemployment' | 'vulnerableEmployment'): number | null {
  const valid = rows.filter((row) => Number.isFinite(row.population) && row.population > 0)
  if (valid.length < 3) return null
  const totalWeight = valid.reduce((sum, row) => sum + row.population, 0)
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) return null
  const meanX = valid.reduce((sum, row) => sum + row.population * row[measure], 0) / totalWeight
  const meanY = valid.reduce((sum, row) => sum + row.population * row.migrationPerThousand, 0) / totalWeight
  let cross = 0
  let squaredX = 0
  let squaredY = 0
  for (const row of valid) {
    const centeredX = row[measure] - meanX
    const centeredY = row.migrationPerThousand - meanY
    cross += row.population * centeredX * centeredY
    squaredX += row.population * centeredX * centeredX
    squaredY += row.population * centeredY * centeredY
  }
  const denominator = Math.sqrt(squaredX) * Math.sqrt(squaredY)
  if (!Number.isFinite(denominator) || denominator === 0) return null
  const value = cross / denominator
  return Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : null
}

export type LeaveOneOutRange = { min: number; max: number; count: number }

/** Range of Pearson values after removing each country once; useful for influence checks. */
export function leaveOneOutPearsonRange(rows: AlignedRow[], measure: 'unemployment' | 'vulnerableEmployment'): LeaveOneOutRange | null {
  if (rows.length < 4) return null
  const values = rows.map((_, index) => pearson(rows.filter((__, candidate) => candidate !== index), measure)).filter((value): value is number => value !== null)
  if (!values.length) return null
  return { min: Math.min(...values), max: Math.max(...values), count: values.length }
}

/** Exact consecutive-year changes; missing years are not bridged or interpolated. */
export function alignWorkMigrationChanges(rows: AlignedRow[], year: number): ChangeRow[] {
  if (!Number.isInteger(year)) return []
  const byCountry = new Map<string, Map<number, AlignedRow>>()
  for (const row of rows) {
    if (!byCountry.has(row.countryCode)) byCountry.set(row.countryCode, new Map())
    byCountry.get(row.countryCode)!.set(row.year, row)
  }
  const changes: ChangeRow[] = []
  for (const countryRows of byCountry.values()) {
    const current = countryRows.get(year)
    const previous = countryRows.get(year - 1)
    if (!current || !previous) continue
    const values = [current.unemployment - previous.unemployment, current.vulnerableEmployment - previous.vulnerableEmployment,
      current.migrationPerThousand - previous.migrationPerThousand]
    if (!values.every(Number.isFinite)) continue
    changes.push({ countryCode: current.countryCode, countryName: current.countryName, continent: current.continent,
      year, previousYear: year - 1, deltaUnemployment: values[0], deltaVulnerableEmployment: values[1], deltaMigrationPerThousand: values[2] })
  }
  return changes.sort((a, b) => a.countryCode.localeCompare(b.countryCode))
}

export function alignedRowsCsv(rows: AlignedRow[], migrationId: string, generatedAt: string) {
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
  const header = ['codigo_pais', 'pais', 'continente', 'ano', 'desemprego_pct', 'emprego_vulneravel_pct',
    'populacao', 'migracao_pessoas', 'migracao_por_1000', 'indicador_migratorio', 'arquivo_gerado_em']
  return '\ufeff' + [header.join(','), ...rows.map((row) => [row.countryCode, row.countryName, row.continent,
    row.year, row.unemployment, row.vulnerableEmployment, row.population, row.migrationCount,
    row.migrationPerThousand, migrationId, generatedAt].map(escape).join(','))].join('\r\n')
}
