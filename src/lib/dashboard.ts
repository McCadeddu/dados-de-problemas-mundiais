import type { DashboardData, Indicator, LatestValue, Ranking, Series } from '../types'

export function getIndicator(data: DashboardData, indicatorId: string) {
  return data.indicators.find((indicator) => indicator.id === indicatorId)
}

export function getIndicatorsByTheme(data: DashboardData, themeId: string) {
  return data.indicators.filter((indicator) => indicator.themeId === themeId)
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
