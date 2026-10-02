import { INCOME_DISTRIBUTION, type IncomeDistribution } from './incomeDistribution.js'

export type PipSurvey = {
  countryCode: string; year: number; surveyYear: number; acronym: string
  welfareType: 'income' | 'consumption'; coverage: string; reportingLevel: string
  interpolated: boolean; estimationType: string; distributionType: string
  comparableSpell: string | null; surveyComparability: number | null
  top10: number; bottom20: number
}
export type SurveyAuditEntry = {
  countryCode: string; year: number; top10: number | null; bottom20: number | null
  status: 'consistent' | 'ambiguous' | 'precision-limited' | 'divergent' | 'unavailable' | 'incomplete'
  candidates: PipSurvey[]
}
export type PipSurveyAudit = {
  fetchedAt: string; lastAttemptAt: string; cached: boolean; version: string; requestUrl: string
  wdiFetchedAt: string; wdiSourceUpdatedAt: string; surveys: PipSurvey[]; entries: SurveyAuditEntry[]
}

/** WDI has one decimal; PIP deciles have four decimals as fractions. Account for both rounding intervals. */
export function auditSurveyPairs(data: IncomeDistribution, surveys: PipSurvey[]): SurveyAuditEntry[] {
  const countries = [...new Set(data.series.map(s => s.countryCode))]
  return countries.flatMap(countryCode => {
    const series = INCOME_DISTRIBUTION.map(d => data.series.find(s => s.countryCode === countryCode && s.indicatorId === d.id))
    const years = [...new Set(series.flatMap(s => s?.points.filter(p => p.value !== null).map(p => p.year) ?? []))].sort((a, b) => a - b)
    return years.map(year => {
      const top10 = series[0]?.points.find(p => p.year === year)?.value ?? null
      const bottom20 = series[1]?.points.find(p => p.year === year)?.value ?? null
      const candidates = surveys.filter(s => s.countryCode === countryCode && s.year === year && Math.floor(s.surveyYear) === year
        && s.reportingLevel === 'national' && s.coverage === 'national' && !s.interpolated && s.estimationType === 'survey')
      const possible = candidates.filter(s => top10 !== null && bottom20 !== null
        && Math.abs(s.top10 - top10) <= 0.055 + 1e-9 && Math.abs(s.bottom20 - bottom20) <= 0.06 + 1e-9)
      const matches = possible.filter(s => Math.abs(s.top10 - top10!) < 0.045 - 1e-9 && Math.abs(s.bottom20 - bottom20!) < 0.04 - 1e-9)
      const status: SurveyAuditEntry['status'] = top10 === null || bottom20 === null ? 'incomplete'
        : possible.length > 1 ? 'ambiguous' : matches.length === 1 ? 'consistent' : possible.length === 1 ? 'precision-limited'
          : candidates.length ? 'divergent' : 'unavailable'
      return { countryCode, year, top10, bottom20, status, candidates: possible.length ? possible : candidates }
    })
  })
}

export const surveyAuditLabels: Record<SurveyAuditEntry['status'], string> = {
  consistent: 'Uma pesquisa PIP com parcelas coincidentes', ambiguous: 'Mais de uma pesquisa PIP numericamente compatível',
  'precision-limited': 'Arredondamento impede confirmar coincidência das parcelas',
  divergent: 'Parcelas da PIP divergem da WDI', unavailable: 'Sem pesquisa nacional elegível na PIP', incomplete: 'Sem as duas parcelas WDI no ano',
}
