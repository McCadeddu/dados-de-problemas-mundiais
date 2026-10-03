import Papa from 'papaparse'
import type { DataPoint, Series } from '../../src/types.js'

export type IloRow = Record<string, string>
export const ILO_BASE = 'https://sdmx.ilo.org/rest'
export const ILO_QUERIES = {
  unemployment: '/data/ILO,DF_UNE_2EAP_SEX_AGE_RT,1.0/.A.UNE_2EAP_RT.SEX_T.AGE_YTHADULT_YGE15',
  employment: '/data/ILO,DF_EMP_2EMP_SEX_STE_NB,1.0/.A.EMP_2EMP_NB.SEX_T.STE_ICSE93_TOTAL+STE_ICSE93_3+STE_ICSE93_5',
} as const
export const STATUS_LABELS: Record<string, string> = { R: 'Real value', I: 'Imputation', A: 'Adjusted', M: 'Model-based extrapolation', E: 'Estimate', F: 'Forecast' }
// R and I are explicit codes in the ILO codelist. Blank or adjusted is not proof of reported data.
export function observationType(statuses: string[]): NonNullable<DataPoint['observationType']> {
  if (statuses.includes('I')) return 'imputed'
  if (statuses.length && statuses.every(s => s === 'R')) return 'reported'
  return 'unknown'
}
export function parseIloCsv(text: string, kind: keyof typeof ILO_QUERIES): IloRow[] {
  const parsed = Papa.parse<IloRow>(text, { header: true, skipEmptyLines: true })
  const required = ['DATAFLOW', 'REF_AREA', 'FREQ', 'MEASURE', 'SEX', 'TIME_PERIOD', 'OBS_VALUE', 'OBS_STATUS', 'UNIT_MEASURE', 'UNIT_MULT', 'SOURCE', kind === 'unemployment' ? 'AGE' : 'STE']
  if (parsed.errors.length || required.some(key => !parsed.meta.fields?.includes(key))) throw new Error(`CSV OIT inválido: ${kind}`)
  return parsed.data
}
export function normalizeIlo(rows: IloRow[], kind: keyof typeof ILO_QUERIES, countries: Map<string, string>, lastYear: number): Series[] {
  const groups = new Map<string, Map<number, IloRow[]>>()
  const flow = kind === 'unemployment' ? 'ILO:DF_UNE_2EAP_SEX_AGE_RT(1.0)' : 'ILO:DF_EMP_2EMP_SEX_STE_NB(1.0)'
  const measure = kind === 'unemployment' ? 'UNE_2EAP_RT' : 'EMP_2EMP_NB'
  for (const row of rows) {
    if (!countries.has(row.REF_AREA)) continue
    if (row.DATAFLOW !== flow || row.FREQ !== 'A' || row.MEASURE !== measure || row.SEX !== 'SEX_T'
      || row.SOURCE !== 'ILO - Modelled Estimates'
      || (kind === 'unemployment' ? row.AGE !== 'AGE_YTHADULT_YGE15' || row.UNIT_MEASURE !== 'PT' || row.UNIT_MULT !== '0'
        : !['STE_ICSE93_TOTAL', 'STE_ICSE93_3', 'STE_ICSE93_5'].includes(row.STE) || row.UNIT_MEASURE !== 'PS' || row.UNIT_MULT !== '3')) {
      throw new Error(`Recorte OIT inesperado: ${kind}/${row.REF_AREA}`)
    }
    if (!/^\d{4}$/.test(row.TIME_PERIOD)) throw new Error('Período OIT não anual')
    const year = Number(row.TIME_PERIOD)
    if (year < 1991 || year > lastYear) continue
    const years = groups.get(row.REF_AREA) ?? new Map<number, IloRow[]>()
    years.set(year, [...(years.get(year) ?? []), row]); groups.set(row.REF_AREA, years)
  }
  const number = (row: IloRow) => /^\d+(\.\d+)?$/.test(row.OBS_VALUE) ? Number(row.OBS_VALUE) : NaN
  return [...groups].flatMap(([country, years]) => {
    const points: DataPoint[] = []
    for (const [year, records] of years) {
      let value: number
      if (kind === 'unemployment') {
        if (records.length !== 1) throw new Error(`Observação OIT duplicada: ${country}/${year}`)
        value = number(records[0])
      } else {
        if (new Set(records.map(r => r.STE)).size !== records.length) throw new Error(`Componente OIT duplicado: ${country}/${year}`)
        const total = records.find(r => r.STE === 'STE_ICSE93_TOTAL')
        const own = records.find(r => r.STE === 'STE_ICSE93_3')
        const family = records.find(r => r.STE === 'STE_ICSE93_5')
        if (!total || !own || !family || !(number(total) > 0)) continue
        value = 100 * (number(own) + number(family)) / number(total)
      }
      if (!Number.isFinite(value) || value < 0 || value > 100) continue
      points.push({ year, value, observationType: observationType(records.map(r => r.OBS_STATUS)),
        sourceObservationStatus: kind === 'unemployment' ? records[0].OBS_STATUS : records.map(r => `${r.STE}=${r.OBS_STATUS || '(vazio)'}`).sort().join('; ') })
    }
    return points.length ? [{ indicatorId: kind === 'unemployment' ? 'ilo-unemployment' : 'ilo-vulnerable-employment', geographyType: 'country' as const,
      geographyCode: country, geographyName: countries.get(country)!, points: points.sort((a, b) => a.year - b.year) }] : []
  }).sort((a, b) => a.geographyCode.localeCompare(b.geographyCode))
}
