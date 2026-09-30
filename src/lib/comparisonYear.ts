import type { DashboardData, LatestValue } from '../types'

/** No latest-value substitution: every displayed territory belongs to one year. */
export function comparisonSnapshot(data: DashboardData, indicatorId: string, requestedYear: number | null, continent: string) {
  const countries = data.countries.filter(c => continent === 'Todos' || c.continent === continent)
  const allowed = new Set(countries.map(c => c.code))
  const series = data.series.filter(s => s.indicatorId === indicatorId && s.geographyType === 'country')
  const years = [...new Set(series.flatMap(s => s.points.filter(p => Number.isFinite(p.value) && Number.isInteger(p.year)).map(p => p.year)))].sort((a, b) => b - a)
  const year = requestedYear !== null && years.includes(requestedYear) ? requestedYear : years[0]
  const grouped = new Map<string, LatestValue[]>()
  for (const s of series) {
    if (!allowed.has(s.geographyCode)) continue
    for (const p of s.points.filter(p => p.year === year)) {
      const rows = grouped.get(s.geographyCode) ?? []
      rows.push({ indicatorId, geographyType: 'country', geographyCode: s.geographyCode, geographyName: s.geographyName, ...p })
      grouped.set(s.geographyCode, rows)
    }
  }
  const values = [...grouped.values()].filter(rows => rows.length === 1 && Number.isFinite(rows[0].value)).map(rows => rows[0])
  const included = new Set(values.map(v => v.geographyCode))
  return { year, years, values, total: countries.length, excluded: countries.filter(c => !included.has(c.code)) }
}

export function permitsCountryRanking(indicatorId: string) {
  // WDI warns against ranking imputed ILO estimates; our files do not retain that flag.
  return !['ilo-unemployment', 'ilo-youth-unemployment', 'ilo-vulnerable-employment', 'wb-female-labor', 'wb-labor-participation-gap'].includes(indicatorId)
}
