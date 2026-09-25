import Papa from 'papaparse'
import type { NationalData } from '../../src/types.js'
import { fetchTextWithRetry } from './http.js'

export const ISTAT_URL = 'https://esploradati.istat.it/SDMXWS/rest/data/IT1,151_874,1.0/M.IT.UNEM_R.Y.9.Y15-74.?startPeriod=2015-01&format=csvfile'
type Collection = NonNullable<NationalData['italyUnemployment']>

// Verified against DCCV_TAXDISOCCUMENS1 1.0 and its codelists on 2026-09-25.
// UNIT_MEAS/UNIT_MULT are blank in this flow; UNEM_R is the documented percentage rate.
const dimensions = { DATAFLOW: 'IT1:151_874(1.0)', FREQ: 'M', REF_AREA: 'IT', DATA_TYPE: 'UNEM_R',
  ADJUSTMENT: 'Y', SEX: '9', AGE: 'Y15-74', UNIT_MEAS: '', UNIT_MULT: '', BASE_PER: '' }
const notes = ['NOTE_DS', 'NOTE_REF_AREA', 'NOTE_DATA_TYPE', 'NOTE_ADJUSTMENT', 'NOTE_SEX', 'NOTE_AGE', 'NOTE_EDITION', 'NOTE_TIME_PERIOD']

function editionDate(edition: string) {
  const match = /^(\d{4})M(\d{1,2})G(\d{1,2})$/.exec(edition)
  if (!match) throw new Error('Istat: edição desconhecida')
  const date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  const parsed = new Date(`${date}T00:00:00Z`)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error('Istat: data de edição inválida')
  return date
}

/** Select a single publication vintage, never splice observations from different revisions. */
export function parseIstatUnemployment(csv: string): Pick<Collection, 'edition' | 'sourceUpdatedAt' | 'points'> {
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: 'greedy' })
  const required = [...Object.keys(dimensions), ...notes, 'EDITION', 'TIME_PERIOD', 'OBS_VALUE', 'OBS_STATUS']
  if (parsed.errors.length || required.some((field) => !parsed.meta.fields?.includes(field)) || !parsed.data.length) throw new Error('Istat: estrutura CSV inesperada ou vazia')
  for (const row of parsed.data) {
    if (Object.entries(dimensions).some(([field, value]) => row[field] !== value)) throw new Error('Istat: recorte ou unidade inesperados')
  }
  const editions = [...new Set(parsed.data.map((row) => row.EDITION))]
    .map((edition) => ({ edition, date: editionDate(edition) })).sort((a, b) => a.date.localeCompare(b.date))
  const latest = editions.at(-1)!
  const seen = new Set<string>()
  const points = parsed.data.filter((row) => row.EDITION === latest.edition).map((row) => {
    const period = row.TIME_PERIOD
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period) || period < '2015-01' || seen.has(period)) throw new Error('Istat: período inválido ou duplicado na edição')
    seen.add(period)
    const rawValue = row.OBS_VALUE.trim()
    const value = rawValue === '' ? null : Number(rawValue)
    if ((value === null && !row.OBS_STATUS) || (value !== null && (!/^\d+(\.\d+)?$/.test(rawValue) || !Number.isFinite(value) || value > 100))) throw new Error('Istat: percentual inválido ou ausência sem sinalização')
    const comment = notes.filter((field) => row[field]).map((field) => `${field}: ${row[field]}`).join('; ')
    return { period, value, ...(row.OBS_STATUS ? { status: row.OBS_STATUS } : {}), ...(comment ? { comment } : {}) }
  }).sort((a, b) => a.period.localeCompare(b.period))
  if (!points.some((point) => point.value !== null)) throw new Error('Istat: edição sem observações')
  return { edition: latest.edition, sourceUpdatedAt: latest.date, points }
}

export async function collectIstatUnemployment(previous?: Collection, fetcher: typeof fetch = fetch): Promise<Collection> {
  const lastAttemptAt = new Date().toISOString()
  try {
    // The SDMX service returns HTTP 500 (languageTag1) without an explicit language.
    const result = parseIstatUnemployment(await fetchTextWithRetry(ISTAT_URL, { fetcher, acceptLanguage: 'en' }))
    const { points } = result
    // The source publishes a full monthly history per vintage. Reject silent truncation.
    const contiguous = points.every((point, index) => {
      const month = 2015 * 12 + index
      return point.period === `${Math.floor(month / 12)}-${String(month % 12 + 1).padStart(2, '0')}`
    })
    if (!contiguous || points.filter((point) => point.value !== null).length < 120
      || (previous && (result.sourceUpdatedAt < previous.sourceUpdatedAt || points.length < previous.points.length
        || previous.points.some((point) => point.value !== null && !points.some((next) => next.period === point.period && next.value !== null))))) {
      throw new Error('Istat: redução de cobertura ou edição anterior; revisar coleta')
    }
    return { ...result, fetchedAt: lastAttemptAt, lastAttemptAt, cached: false,
      sourceUrl: 'https://esploradati.istat.it/databrowser/',
      methodologyUrl: 'https://www.istat.it/wp-content/uploads/2026/09/CS_Occupati-e-disoccupati_LUGLIO_2026.pdf',
      licenseUrl: 'https://www.istat.it/note-legali/', requestUrl: ISTAT_URL }
  } catch (error) {
    if (!previous?.points.some((point) => point.value !== null)) throw error
    console.warn(`Istat indisponível; mantendo coleta de ${previous.fetchedAt}: ${String(error)}`)
    return { ...previous, cached: true, lastAttemptAt }
  }
}
