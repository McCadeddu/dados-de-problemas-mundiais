export type ThemeId =
  | 'hunger-water'
  | 'gender-equality'
  | 'poverty-inequality'
  | 'climate-vulnerability'
  | 'forced-migration'

export type GeographyType = 'country' | 'brazil-state' | 'brazil-immediate-region'

export type Theme = {
  id: ThemeId
  name: string
  description: string
}

export type Source = {
  id: string
  name: string
  url: string
  methodologyUrl: string
  license: string
  lastUpdated: string
}

export type Indicator = {
  id: string
  name: string
  themeId: ThemeId
  description: string
  unit: string
  geographyType: GeographyType
  sourceId: string
  direction: 'higher-better' | 'higher-worse'
  latestYear: number
}

export type DataPoint = {
  year: number
  value: number
}

export type Series = {
  indicatorId: string
  geographyType: GeographyType
  geographyCode: string
  geographyName: string
  points: DataPoint[]
}

export type LatestValue = {
  indicatorId: string
  geographyType: GeographyType
  geographyCode: string
  geographyName: string
  year: number
  value: number
}

export type Ranking = {
  indicatorId: string
  geographyType: GeographyType
  year: number
  items: LatestValue[]
}

export type DashboardData = {
  generatedAt: string
  themes: Theme[]
  indicators: Indicator[]
  sources: Source[]
  countries: Array<{ code: string; name: string; continent: string }>
  continents: string[]
  brazilStates: Array<{ code: string; name: string }>
  brazilImmediateRegions: Array<{ code: string; name: string; stateCode: string }>
  series: Series[]
  latest: LatestValue[]
  rankings: Ranking[]
  countryPopulation: Array<{
    geographyCode: string
    points: DataPoint[]
  }>
  worldPopulation?: {
    value: number
    referenceYear: number
    annualChange: number
    sourceId: string
  }
  notes: string[]
}
