import type { DashboardData, Indicator, LatestValue, Ranking, Series, ThemeId } from '../types'

export function getIndicator(data: DashboardData, indicatorId: string) {
  return data.indicators.find((indicator) => indicator.id === indicatorId)
}

export function getIndicatorsByTheme(data: DashboardData, themeId: string) {
  return data.indicators.filter((indicator) => indicator.themeId === themeId)
}

export function getSafeThemeId(data: DashboardData, requestedThemeId: string): ThemeId {
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
  if (!values.length || new Set(values.map(value => value.indicatorId)).size !== 1
    || new Set(values.map(value => value.year)).size !== 1
    || new Set(values.map(value => value.geographyCode)).size !== values.length
    || values.some(value => value.geographyType !== 'country' || !Number.isFinite(value.value) || value.value < 0 || value.value > 100
      || !supportsTotalPopulationAverage(getIndicator(data, value.indicatorId)))) return null
  const populationByCountry = new Map(data.countryPopulation.map((entry) => [entry.geographyCode, entry.points]))
  let weightedTotal = 0
  let populationTotal = 0
  let coverage = 0
  const years: number[] = []
  for (const value of values) {
    const population = populationByCountry.get(value.geographyCode)?.find((point) => point.year === value.year)?.value
    if (!population || population < 0 || !Number.isFinite(population) || !Number.isFinite(value.value)) continue
    weightedTotal += value.value * population
    populationTotal += population
    coverage += 1
    years.push(value.year)
  }
  return populationTotal > 0 ? {
    value: weightedTotal / populationTotal,
    coverage,
    firstYear: Math.min(...years),
    lastYear: Math.max(...years),
  } : null
}

export function supportsTotalPopulationAverage(indicator?: Indicator) {
  return indicator?.geographyType === 'country' && indicator.themeId === 'hunger-water' && indicator.unit === '%'
    && ['wb-basic-water', 'wb-safely-managed-water'].includes(indicator.id)
}

export function aggregationExplanation(indicator: Indicator) {
  if (supportsTotalPopulationAverage(indicator)) return 'Estimativa do painel para os países cobertos, ponderada pela população em um único ano; não é um agregado oficial. A cobertura pode variar entre anos e continentes.'
  if (['wb-undernourishment', 'wb-moderate-severe-food-insecurity'].includes(indicator.id)) return 'Os agregados oficiais de alimentação estão no complemento acima, com regiões e anos próprios da fonte. O painel não calcula uma média dos últimos valores nacionais para estes indicadores.'
  if (indicator.unit === 'pessoas') return 'Contagens não recebem média ponderada pela população. Um total territorial exige soma validada, no mesmo ano, com cobertura e ausência de duplicidades verificadas; esse total ainda não está integrado.'
  if (indicator.id === 'wb-gini') return 'A média dos Ginis nacionais não mede a desigualdade continental ou mundial. Para isso, é necessária a distribuição conjunta de renda ou consumo.'
  if (['wb-income-top-10', 'wb-income-bottom-20'].includes(indicator.id)) return 'Cada parcela descreve a distribuição da população abrangida pela pesquisa do país; confira as notas de cobertura. Não há agregado continental ou mundial: a média das parcelas nacionais não reconstrói a distribuição conjunta. Mesmo ano e conceito não comprovam pesquisas equivalentes.'
  if (indicator.id === 'wb-poverty-685') return 'O complemento oficial de pobreza compara país, regiões Banco Mundial e mundo na linha de US$ 8,30/dia em PPC de 2021, com ano próprio. O painel não recalcula esses agregados a partir dos últimos valores nacionais.'
  if (indicator.themeId === 'climate-vulnerability') return 'Os índices ND-GAIN descrevem países. O painel não os transforma em um índice continental ou mundial por ponderação populacional.'
  return 'Sem agregado calculado: é preciso validar o denominador, o período de referência e a comparabilidade de cada indicador. Os dados nacionais continuam disponíveis no mapa e nas comparações.'
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
    return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
  }
  if (unit === 'p.p.') {
    return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} p.p.`
  }
  if (unit === 'índice 0-1') {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
  }
  if (unit === 'mil pessoas') {
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
  }
  if (unit === 'pessoas') {
    return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
  }
  if (unit === 'score' || unit === 'índice') {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
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
