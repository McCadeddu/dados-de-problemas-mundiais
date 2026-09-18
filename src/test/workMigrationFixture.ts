import type { DashboardData, Series } from '../types'

export function workMigrationFixture(): DashboardData {
  const countries = [
    { code: 'AAA', name: 'País A', continent: 'Europe' },
    { code: 'BBB', name: 'País B', continent: 'Europe' },
    { code: 'CCC', name: 'País C', continent: 'Asia' },
    { code: 'DDD', name: 'País D', continent: 'Europe' },
  ]
  const series: Series[] = countries.flatMap((country, index) => [
    ['ilo-unemployment', [30 - index * 10, (index + 1) * 10]],
    ['ilo-vulnerable-employment', [20, (index + 1) * 20]],
    ['unhcr-refugees-hosted', [1000, index * 1000]],
    ['unhcr-asylum-seekers-hosted', [500, (3 - index) * 1000]],
    ['wb-migrant-stock', [6000, 0]],
  ].map(([id, values]) => ({
    indicatorId: id as string, geographyType: 'country', geographyCode: country.code, geographyName: country.name,
    // Stock has no 2025 release. D has no migration observation in 2025.
    points: [2024, 2025].filter((year) => year === 2024 || (id !== 'wb-migrant-stock' && (index !== 3 || String(id).startsWith('ilo-'))))
      .map((year) => ({ year, value: (values as number[])[year - 2024] })).reverse(),
  })))
  return {
    generatedAt: '2026-09-18T12:00:00Z', countries, continents: ['Europe', 'Asia'], series,
    countryPopulation: countries.map((country) => ({ geographyCode: country.code,
      points: [{ year: 2024, value: 100000 }, { year: 2025, value: 100000 }] })),
    themes: [], indicators: [], sources: [], latest: [], rankings: [], brazilStates: [], brazilImmediateRegions: [], notes: [],
  }
}
