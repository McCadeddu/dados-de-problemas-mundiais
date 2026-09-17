import type { DashboardData, Indicator, LatestValue, Ranking, Series } from '../types'

export function getIndicator(data: DashboardData, indicatorId: string) {
  return data.indicators.find((indicator) => indicator.id === indicatorId)
}

export function getIndicatorsByTheme(data: DashboardData, themeId: string) {
  return data.indicators.filter((indicator) => indicator.themeId === themeId)
}

export function getSafeThemeId(data: DashboardData, requestedThemeId: string) {
  return data.themes.find((theme) => theme.id === requestedThemeId)?.id
    ?? data.themes[0]?.id
    ?? 'hunger-water'
}

export function getSeriesForGeography(
  data: DashboardData,
  indicatorId: string,
  geographyCode: string,
) {
  return data.series.find(
    (entry) => entry.indicatorId === indicatorId && entry.geographyCode === geographyCode,
  )
}

export function getLatestByIndicator(
  data: DashboardData,
  indicatorId: string,
  geographyType: Series['geographyType'],
) {
  return data.latest.filter(
    (item) => item.indicatorId === indicatorId && item.geographyType === geographyType,
  )
}

export function getPopulationWeightedAverage(data: DashboardData, values: LatestValue[]) {
  const populationByCountry = new Map(data.countryPopulation.map((entry) => [entry.geographyCode, entry.points]))
  let weightedTotal = 0
  let populationTotal = 0
  let coverage = 0
  for (const value of values) {
    const population = populationByCountry.get(value.geographyCode)?.find((point) => point.year === value.year)?.value
    if (!population || !Number.isFinite(population)) continue
    weightedTotal += value.value * population
    populationTotal += population
    coverage += 1
  }
  return populationTotal > 0 ? { value: weightedTotal / populationTotal, coverage } : null
}

export function getRanking(data: DashboardData, indicatorId: string): Ranking | undefined {
  return data.rankings.find((ranking) => ranking.indicatorId === indicatorId)
}

export function getTopRanked(data: DashboardData, indicatorId: string, limit = 10): LatestValue[] {
  return getRanking(data, indicatorId)?.items.slice(0, limit) ?? []
}

export function getDefaultIndicator(data: DashboardData, themeId: string): Indicator | undefined {
  return data.indicators.find((indicator) => indicator.themeId === themeId)
}

export function formatValue(value: number, unit: string) {
  if (unit === '%') {
    return `${value.toFixed(1)}%`
  }
  if (unit === 'p.p.') {
    return `${value.toFixed(1)} p.p.`
  }
  if (unit === 'índice 0-1') {
    return value.toFixed(3)
  }
  if (unit === 'mil pessoas') {
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
  }
  if (unit === 'pessoas') {
    return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
  }
  if (unit === 'score' || unit === 'índice') {
    return value.toFixed(1)
  }
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

export function getMetricSummary(data: DashboardData) {
  return {
    countries: data.countries.length,
    states: data.brazilStates.length,
    countryIndicators: data.indicators.filter((indicator) => indicator.geographyType === 'country')
      .length,
    brazilIndicators: data.indicators.filter(
      (indicator) => indicator.geographyType === 'brazil-state',
    ).length,
  }
}
