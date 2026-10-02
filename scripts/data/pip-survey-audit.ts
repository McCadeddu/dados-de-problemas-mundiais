import { fetchJsonWithRetry } from './http.js'
import { auditSurveyPairs, type PipSurvey, type PipSurveyAudit } from '../../src/lib/pipSurveyAudit.js'
import type { IncomeDistribution } from '../../src/lib/incomeDistribution.js'

type Version = { version: string; ppp_version: string; release_version: string; identity: string }
export const pipVersionsUrl = 'https://api.worldbank.org/pip/v1/versions?format=json'
export const pipSurveyUrl = (version: string) => `https://api.worldbank.org/pip/v1/pip?country=all&year=all&fill_gaps=false&reporting_level=national&welfare_type=all&version=${encodeURIComponent(version)}&format=json`

export function latestPipVersion(raw: Version[]) {
  if (!Array.isArray(raw)) throw new Error('PIP: catálogo de edições inválido')
  const version = raw.filter(v => v.ppp_version === '2021' && v.identity === 'PROD' && /^\d{8}_2021_\d{2}_\d{2}_PROD$/.test(v.version)
    && v.version.startsWith(v.release_version)).sort((a, b) => b.release_version.localeCompare(a.release_version))[0]?.version
  if (!version) throw new Error('PIP: edição PPC 2021 ausente')
  return version
}

export function parsePipSurveys(raw: Record<string, unknown>[]): PipSurvey[] {
  if (!Array.isArray(raw) || !raw.length) throw new Error('PIP: resposta vazia ou inválida')
  const seen = new Set<string>()
  return raw.map(row => {
    const numbers = ['reporting_year', 'survey_year', 'decile1', 'decile2', 'decile10']
    if (!numbers.every(k => typeof row[k] === 'number' && Number.isFinite(row[k]))
      || !Number.isInteger(row.reporting_year) || Number(row.survey_year) < 1900
      || !/^[A-Z]{3}$/.test(String(row.country_code)) || typeof row.survey_acronym !== 'string' || !row.survey_acronym.trim()
      || !['income', 'consumption'].includes(String(row.welfare_type)) || typeof row.is_interpolated !== 'boolean'
      || !['survey_coverage', 'reporting_level', 'estimation_type', 'distribution_type'].every(k => typeof row[k] === 'string')
      || ['decile1', 'decile2', 'decile10'].some(k => Number(row[k]) < 0 || Number(row[k]) > 1)
      || Number(row.decile1) + Number(row.decile2) > 1
      || (row.comparable_spell !== null && typeof row.comparable_spell !== 'string')
      || (row.survey_comparability !== null && typeof row.survey_comparability !== 'number')) throw new Error('PIP: pesquisa inválida')
    const key = [row.country_code, row.reporting_year, row.survey_year, row.survey_acronym, row.welfare_type, row.reporting_level].join('|')
    if (seen.has(key)) throw new Error('PIP: pesquisa duplicada')
    seen.add(key)
    return { countryCode: String(row.country_code), year: Number(row.reporting_year), surveyYear: Number(row.survey_year),
      acronym: String(row.survey_acronym), welfareType: row.welfare_type as PipSurvey['welfareType'], coverage: String(row.survey_coverage),
      reportingLevel: String(row.reporting_level), interpolated: row.is_interpolated as boolean, estimationType: String(row.estimation_type),
      distributionType: String(row.distribution_type), comparableSpell: row.comparable_spell as string | null,
      surveyComparability: row.survey_comparability as number | null, top10: Number(row.decile10) * 100,
      bottom20: (Number(row.decile1) + Number(row.decile2)) * 100 }
  })
}

export async function collectPipSurveyAudit(data: IncomeDistribution, previous?: PipSurveyAudit, fetcher: typeof fetch = fetch): Promise<PipSurveyAudit> {
  const now = new Date().toISOString()
  let base: Pick<PipSurveyAudit, 'fetchedAt' | 'cached' | 'version' | 'requestUrl' | 'surveys'>
  try {
    const version = latestPipVersion(await fetchJsonWithRetry<Version[]>(pipVersionsUrl, { fetcher }))
    const surveys = parsePipSurveys(await fetchJsonWithRetry<Record<string, unknown>[]>(pipSurveyUrl(version), { fetcher }))
    if (previous?.surveys.some(old => !surveys.some(s => s.countryCode === old.countryCode && s.year === old.year && s.acronym === old.acronym && s.welfareType === old.welfareType && s.reportingLevel === old.reportingLevel))) throw new Error('PIP: perda de cobertura; revisão necessária')
    base = { fetchedAt: now, cached: false, version, requestUrl: pipSurveyUrl(version), surveys }
  } catch (error) {
    if (!previous?.surveys.length) throw error
    console.warn(`PIP: mantendo pesquisas anteriores: ${String(error)}`)
    base = { ...previous, cached: true }
  }
  return { ...base, lastAttemptAt: now, wdiFetchedAt: data.fetchedAt, wdiSourceUpdatedAt: data.sourceUpdatedAt, entries: auditSurveyPairs(data, base.surveys) }
}

export function pipAuditCsv(data: PipSurveyAudit) {
  const q = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`
  const rows: unknown[][] = [['pais', 'ano_wdi', 'parcela_10_wdi', 'parcela_20_wdi', 'resultado', 'pesquisa_candidata', 'conceito_pip', 'ano_pesquisa_pip', 'parcela_10_pip', 'parcela_20_pip', 'periodo_comparavel_nacional_pip', 'versao_pip', 'coleta_pip', 'ultima_tentativa_pip', 'cache_pip', 'coleta_wdi', 'atualizacao_wdi', 'consulta_pip', 'cobertura_pip', 'nivel_pip', 'interpolacao_pip', 'tipo_estimativa_pip', 'tipo_distribuicao_pip', 'licenca']]
  for (const entry of data.entries) for (const candidate of entry.candidates.length ? entry.candidates : [null]) rows.push([
    entry.countryCode, entry.year, entry.top10, entry.bottom20, entry.status, candidate?.acronym, candidate?.welfareType,
    candidate?.surveyYear, candidate?.top10, candidate?.bottom20, candidate?.comparableSpell, data.version, data.fetchedAt,
    data.lastAttemptAt, data.cached, data.wdiFetchedAt, data.wdiSourceUpdatedAt, data.requestUrl,
    candidate?.coverage, candidate?.reportingLevel, candidate?.interpolated, candidate?.estimationType, candidate?.distributionType,
    'https://datacatalog.worldbank.org/int/public-licenses#cc-by',
  ])
  return '\ufeff' + rows.map(row => row.map(q).join(',')).join('\r\n') + '\r\n'
}
