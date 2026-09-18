export type ThemeId =
  | 'hunger-water'
  | 'gender-equality'
  | 'poverty-inequality'
  | 'climate-vulnerability'
  | 'forced-migration'
  | 'illiteracy'
  | 'decent-work'

export type NationalSource = {
  countryCode: string
  countryName: string
  institution: string | null
  url: string | null
  evidenceUrl: string
  status: 'directory-listed' | 'documented' | 'existing-connector' | 'pending'
  checkedAt: string
}

export type NationalData = {
  generatedAt: string
  registry: NationalSource[]
  poverty: {
    fetchedAt: string
    sourceUpdatedAt: string
    cached: boolean
    sourceUrl: string
    methodologyUrl: string
    licenseUrl: string
    requestUrl: string
    series: Array<{ countryCode: string; points: Array<{ year: number; value: number; status?: string }> }>
  }
}

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
  direction: 'higher-better' | 'higher-worse' | 'neutral'
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

export type MigrationFlow = {
  originCode: string
  originName: string
  asylumCode: string
  asylumName: string
  value: number
  year: number
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
