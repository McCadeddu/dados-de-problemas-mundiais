import type { Indicator } from '../types.js'

export const INCOME_DISTRIBUTION = [
  { id: 'wb-income-top-10', code: 'SI.DST.10TH.10', sourceName: 'Income share held by highest 10%',
    name: 'Parcela da renda ou consumo dos 10% mais ricos', direction: 'higher-worse' as const,
    description: 'Percentual da renda ou consumo total apropriado pelos 10% da população com maior renda ou consumo per capita. A base é a distribuição de cada país na pesquisa domiciliar; não mede patrimônio acumulado.' },
  { id: 'wb-income-bottom-20', code: 'SI.DST.FRST.20', sourceName: 'Income share held by lowest 20%',
    name: 'Parcela da renda ou consumo dos 20% mais pobres', direction: 'higher-better' as const,
    description: 'Percentual da renda ou consumo total apropriado pelos 20% da população com menor renda ou consumo per capita. O ano corresponde à pesquisa domiciliar; não mede a proporção de pessoas abaixo de uma linha de pobreza.' },
]

export function incomeIndicator(definition: typeof INCOME_DISTRIBUTION[number], latestYear: number): Indicator {
  return { id: definition.id, name: definition.name, description: definition.description,
    themeId: 'poverty-inequality', unit: '%', geographyType: 'country', sourceId: 'world-bank', direction: definition.direction, latestYear }
}

export type IncomeDistribution = {
  fetchedAt: string; lastAttemptAt: string; sourceUpdatedAt: string; cached: boolean
  licenseUrl: string
  indicators: { id: string; code: string; name: string; sourceNote: string; sourceOrganization: string; requestUrl: string; metadataUrl: string; methodologyUrl: string }[]
  series: { indicatorId: string; countryCode: string; countryName: string; points: { year: number; value: number | null; status: string }[] }[]
}

export function incomePairYears(data: IncomeDistribution, countryCode: string) {
  const sets = INCOME_DISTRIBUTION.map(d => new Set(data.series.find(s => s.indicatorId === d.id && s.countryCode === countryCode)?.points.filter(p => p.value !== null).map(p => p.year) ?? []))
  return [...sets[0]].filter(year => sets[1].has(year)).sort((a, b) => b - a)
}
