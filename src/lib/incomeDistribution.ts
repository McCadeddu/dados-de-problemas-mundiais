import type { Indicator, IncomeObservationMetadata } from '../types.js'

export type IncomeConcept = 'all' | 'income' | 'consumption'
export function parseIncomeFootnote(note: string): IncomeObservationMetadata | undefined {
  const match = /^Based on data from ([^.]+)\. Estimated from (unit-record|grouped) (income|consumption) data\.( Urban only\.)?$/.exec(note.trim())
  if (!match) return undefined
  return { surveyAcronym: match[1].trim(), distributionType: match[2] as IncomeObservationMetadata['distributionType'],
    welfareType: match[3] as IncomeObservationMetadata['welfareType'], coverageRestriction: match[4] ? 'urban-only' : 'not-stated' }
}
export const isIncomeDistribution = (id: string) => INCOME_DISTRIBUTION.some(d => d.id === id)
export function permitsIncomeConcept(metadata: IncomeObservationMetadata | undefined, concept: IncomeConcept) {
  return concept === 'all' || (metadata?.welfareType === concept && metadata.coverageRestriction !== 'urban-only')
}

export const INCOME_DISTRIBUTION = [
  { id: 'wb-income-top-10', code: 'SI.DST.10TH.10', sourceName: 'Income share held by highest 10%',
    name: 'Parcela da renda ou consumo dos 10% mais ricos', direction: 'higher-worse' as const,
    description: 'Percentual da renda ou consumo total apropriado pelos 10% da população com maior renda ou consumo per capita. A base é a população abrangida pela pesquisa domiciliar do país; confira restrições de cobertura nas notas WDI. Não mede patrimônio acumulado.' },
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
  series: { indicatorId: string; countryCode: string; countryName: string; points: { year: number; value: number | null; status: string; sourceFootnote?: string; sourceIncomeMetadata?: IncomeObservationMetadata }[] }[]
}

export function incomePairYears(data: IncomeDistribution, countryCode: string) {
  const sets = INCOME_DISTRIBUTION.map(d => new Set(data.series.find(s => s.indicatorId === d.id && s.countryCode === countryCode)?.points.filter(p => p.value !== null).map(p => p.year) ?? []))
  return [...sets[0]].filter(year => sets[1].has(year)).sort((a, b) => b - a)
}
