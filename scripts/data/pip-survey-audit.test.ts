import { describe, expect, it, vi } from 'vitest'
import { auditSurveyPairs } from '../../src/lib/pipSurveyAudit.js'
import type { IncomeDistribution } from '../../src/lib/incomeDistribution.js'
import { collectPipSurveyAudit, latestPipVersion, parsePipSurveys, pipAuditCsv } from './pip-survey-audit.js'
import Papa from 'papaparse'

const data = { fetchedAt: '2026-10-02', sourceUpdatedAt: '2026-07-13', series: [
  { countryCode: 'BRA', indicatorId: 'wb-income-top-10', points: [{ year: 2024, value: 39.3 }, { year: 2023, value: 0 }] },
  { countryCode: 'BRA', indicatorId: 'wb-income-bottom-20', points: [{ year: 2024, value: 3.9 }, { year: 2023, value: null }] },
] } as IncomeDistribution
const row = { country_code: 'BRA', reporting_year: 2024, survey_year: 2024, survey_acronym: 'PNADC-E1', welfare_type: 'income',
  survey_coverage: 'national', reporting_level: 'national', is_interpolated: false, estimation_type: 'survey', distribution_type: 'micro',
  comparable_spell: '2012 - 2024', survey_comparability: 1, decile10: 0.3933, decile1: 0.0135, decile2: 0.0256 }
const survey = parsePipSurveys([row])[0]
const version = { version: '20260922_2021_01_02_PROD', ppp_version: '2021', release_version: '20260922', identity: 'PROD' }

describe('PIP survey evidence', () => {
  it('requires agreement of both shares and distinguishes ambiguity, divergence and missing pairs', () => {
    expect(auditSurveyPairs(data, [survey]).map(e => e.status)).toEqual(['incomplete', 'consistent'])
    expect(auditSurveyPairs(data, [survey, { ...survey, acronym: 'OTHER', welfareType: 'consumption' }]).at(-1)?.status).toBe('ambiguous')
    expect(auditSurveyPairs(data, [{ ...survey, bottom20: 4.1 }]).at(-1)?.status).toBe('divergent')
    expect(auditSurveyPairs(data, [{ ...survey, top10: 40 }]).at(-1)?.status).toBe('divergent')
  })
  it('rejects interpolated, nonnational and different survey years as candidates', () => {
    for (const change of [{ interpolated: true }, { coverage: 'urban' }, { reportingLevel: 'rural' }, { surveyYear: 2023.5 }, { estimationType: 'nowcast' }, { year: 2025 }]) {
      expect(auditSurveyPairs(data, [{ ...survey, ...change }]).at(-1)?.status).toBe('unavailable')
    }
  })
  it('keeps double-rounding boundaries inconclusive rather than reporting an edition divergence', () => {
    expect(auditSurveyPairs(data, [{ ...survey, top10: 39.35 }]).at(-1)?.status).toBe('precision-limited')
    expect(auditSurveyPairs(data, [{ ...survey, bottom20: 3.95 }]).at(-1)?.status).toBe('precision-limited')
    expect(auditSurveyPairs(data, [{ ...survey, top10: 39.4 }]).at(-1)?.status).toBe('divergent')
  })
  it('validates schema, proportions and duplicate surveys without conflating concepts', () => {
    expect(() => parsePipSurveys([])).toThrow()
    for (const change of [{ welfare_type: 'unknown' }, { decile10: null }, { decile1: -1 }, { decile2: 2 }, { survey_acronym: '' }, { is_interpolated: null }]) expect(() => parsePipSurveys([{ ...row, ...change }])).toThrow()
    expect(() => parsePipSurveys([row, row])).toThrow('duplicada')
    expect(parsePipSurveys([row, { ...row, welfare_type: 'consumption' }])).toHaveLength(2)
    expect(survey.bottom20).toBeCloseTo(3.91)
  })
  it('fixes the latest production PPC 2021 edition regardless of response order', () => {
    expect(latestPipVersion([{ ...version, version: '20260324_2021_01_02_PROD', release_version: '20260324' }, version])).toBe(version.version)
    expect(() => latestPipVersion([{ ...version, ppp_version: '2017' }])).toThrow()
  })
  it('recomputes cached evidence against current WDI and never treats a transport failure as an empty survey list', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify([version]))).mockResolvedValueOnce(new Response(JSON.stringify([row])))
    const audit = await collectPipSurveyAudit(data, undefined, fetcher)
    const fail = vi.fn().mockResolvedValue(new Response('no', { status: 404 }))
    await expect(collectPipSurveyAudit(data, undefined, fail)).rejects.toThrow()
    const changed = { ...data, fetchedAt: '2026-10-03', series: data.series.map(s => ({ ...s, points: s.points.map(p => ({ ...p, value: p.year === 2024 ? 99 : p.value })) })) }
    const cached = await collectPipSurveyAudit(changed, audit, fail)
    expect(cached.cached).toBe(true)
    expect(cached.fetchedAt).toBe(audit.fetchedAt)
    expect(cached.wdiFetchedAt).toBe(changed.fetchedAt)
    expect(cached.entries.at(-1)?.status).toBe('divergent')
    const csv = Papa.parse<Record<string, string>>(pipAuditCsv(audit), { header: true, skipEmptyLines: true }).data
    expect(csv[0].parcela_10_wdi).toBe('0')
    expect(csv[0].parcela_20_wdi).toBe('')
    expect(csv[1].pesquisa_candidata).toBe('PNADC-E1')
    expect(csv[1].versao_pip).toBe(version.version)
  })
})
