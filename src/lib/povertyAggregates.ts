export const POVERTY_REGIONS = ['EAS', 'ECS', 'LCN', 'MEA', 'NAC', 'SAS', 'SSF'] as const
export type PovertyAggregates = {
  fetchedAt: string; lastAttemptAt: string; sourceUpdatedAt: string; cached: boolean
  requestUrl: string; geographyUrl: string; metadataUrl: string; methodologyUrl: string; licenseUrl: string
  indicator: { code: 'SI.POV.UMIC'; name: string; sourceNote: string; sourceOrganization: string; povertyLine: 8.3; pppYear: 2021 }
  areas: Array<{ code: string; name: string; kind: 'country' | 'region' | 'world' }>
  series: Array<{ areaCode: string; points: Array<{ year: number; value: number | null; status: string }> }>
}

export function povertyValue(data: PovertyAggregates, areaCode: string, year: number | undefined) {
  return data.series.find(s => s.areaCode === areaCode)?.points.find(p => p.year === year)
}
