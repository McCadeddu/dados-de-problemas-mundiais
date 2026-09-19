import Papa from 'papaparse'
import type { NationalData } from '../../src/types.js'

export const ABS_URL = 'https://data.api.abs.gov.au/rest/data/ABS,LF,1.0.0/M13.3.1599.20.AUS.M?startPeriod=2015-01&format=csv'
type Collection = NonNullable<NationalData['australiaUnemployment']>

// Codes checked against ABS LF 1.0.0 structure and codelists on 2026-09-18.
const dimensions = { DATAFLOW: 'ABS:LF(1.0.0)', MEASURE: 'M13', SEX: '3', AGE: '1599', TSEST: '20', REGION: 'AUS', FREQ: 'M', UNIT_MEASURE: 'PCT', UNIT_MULT: '0', DECIMALS: '1' }

export function parseAbsUnemployment(csv: string): Collection['points'] {
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: 'greedy' })
  if (parsed.errors.length || [...Object.keys(dimensions), 'TIME_PERIOD', 'OBS_VALUE', 'OBS_STATUS', 'OBS_COMMENT'].some((key) => !parsed.meta.fields?.includes(key))) {
    throw new Error('ABS: estrutura CSV inesperada')
  }
  const periods = new Set<string>()
  const points = parsed.data.map((row) => {
    if (Object.entries(dimensions).some(([key, code]) => row[key] !== code)) throw new Error('ABS: recorte ou unidade inesperados')
    const period = row.TIME_PERIOD
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period) || period < '2015-01' || periods.has(period)) throw new Error('ABS: período inválido ou duplicado')
    periods.add(period)
    const value = row.OBS_VALUE.trim() === '' ? null : Number(row.OBS_VALUE)
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 100)) throw new Error('ABS: percentual inválido')
    return { period, value, ...(row.OBS_STATUS ? { status: row.OBS_STATUS } : {}), ...(row.OBS_COMMENT ? { comment: row.OBS_COMMENT } : {}) }
  }).sort((a, b) => a.period.localeCompare(b.period))
  if (!points.some((point) => point.value !== null)) throw new Error('ABS: série sem valores')
  return points
}

export async function collectAbsUnemployment(previous?: Collection, fetcher: typeof fetch = fetch): Promise<Collection> {
  const lastAttemptAt = new Date().toISOString()
  try {
    const response = await fetcher(ABS_URL, { signal: AbortSignal.timeout(60000) })
    if (!response.ok) throw new Error(`ABS HTTP ${response.status}`)
    const points = parseAbsUnemployment(await response.text())
    if (points.filter((point) => point.value !== null).length < 120
      || (previous && (points.length < previous.points.length || points.at(-1)!.period < previous.points.at(-1)!.period))) {
      throw new Error('ABS: cobertura menor que a esperada; revisar resposta')
    }
    return {
      fetchedAt: lastAttemptAt, lastAttemptAt, cached: false,
      sourceUrl: 'https://www.abs.gov.au/statistics/labour/employment-and-unemployment/labour-force-australia/latest-release',
      methodologyUrl: 'https://www.abs.gov.au/methodologies/labour-force-australia-methodology/latest-release',
      licenseUrl: 'https://www.abs.gov.au/website-privacy-copyright-and-disclaimer',
      requestUrl: ABS_URL, points,
    }
  } catch (error) {
    if (!previous?.points.some((point) => point.value !== null)) throw error
    console.warn(`ABS indisponível; mantendo coleta de ${previous.fetchedAt}: ${String(error)}`)
    return { ...previous, cached: true, lastAttemptAt }
  }
}
