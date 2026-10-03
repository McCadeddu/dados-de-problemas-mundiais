import { describe, expect, it } from 'vitest'
import { normalizeIlo, observationType, parseIloCsv, type IloRow } from './ilo-observations.js'

const countries = new Map([['BRA', 'Brasil']])
function row(kind: 'unemployment' | 'employment', status = 'R', classification = 'STE_ICSE93_TOTAL', value = '100'): IloRow {
  return { DATAFLOW: kind === 'unemployment' ? 'ILO:DF_UNE_2EAP_SEX_AGE_RT(1.0)' : 'ILO:DF_EMP_2EMP_SEX_STE_NB(1.0)',
    REF_AREA: 'BRA', FREQ: 'A', MEASURE: kind === 'unemployment' ? 'UNE_2EAP_RT' : 'EMP_2EMP_NB', SEX: 'SEX_T',
    AGE: 'AGE_YTHADULT_YGE15', STE: classification, TIME_PERIOD: '2024', OBS_VALUE: value, OBS_STATUS: status,
    UNIT_MEASURE: kind === 'unemployment' ? 'PT' : 'PS', UNIT_MULT: kind === 'unemployment' ? '0' : '3', SOURCE: 'ILO - Modelled Estimates' }
}
describe('ILO direct observation classification', () => {
  it('requires explicit real-value codes and never treats blank or adjusted as reported', () => {
    expect(observationType(['R'])).toBe('reported')
    expect(observationType(['R', 'I', ''])).toBe('imputed')
    for (const flags of [[], [''], ['A'], ['E'], ['F'], ['M'], ['R', '']]) expect(observationType(flags)).toBe('unknown')
  })
  it('preserves a reported zero and excludes future periods, suppressed values and source aggregates', () => {
    const rows = [row('unemployment', 'R', '', '0'), { ...row('unemployment'), REF_AREA: 'X01' },
      { ...row('unemployment'), TIME_PERIOD: '2026' }, { ...row('unemployment'), TIME_PERIOD: '2023', OBS_VALUE: '..' }]
    expect(normalizeIlo(rows, 'unemployment', countries, 2025)[0].points).toEqual([{ year: 2024, value: 0, observationType: 'reported', sourceObservationStatus: 'R' }])
  })
  it('derives vulnerable employment only from all three components and combines their statuses conservatively', () => {
    const rows = [row('employment'), row('employment', 'R', 'STE_ICSE93_3', '25'), row('employment', 'R', 'STE_ICSE93_5', '0')]
    expect(normalizeIlo(rows, 'employment', countries, 2025)[0].points[0]).toMatchObject({ value: 25, observationType: 'reported' })
    rows[0].OBS_STATUS = ''
    expect(normalizeIlo(rows, 'employment', countries, 2025)[0].points[0].observationType).toBe('unknown')
    expect(normalizeIlo(rows.slice(0, 2), 'employment', countries, 2025)).toEqual([])
    rows[0].OBS_VALUE = '0'
    expect(normalizeIlo(rows, 'employment', countries, 2025)).toEqual([])
  })
  it('rejects duplicate observations, unexpected definitions and units instead of choosing a value', () => {
    expect(() => normalizeIlo([row('unemployment'), row('unemployment')], 'unemployment', countries, 2025)).toThrow('duplicada')
    const changes: IloRow[] = [{ SEX: 'SEX_F' }, { AGE: 'AGE_YTHADULT_Y15-24' }, { FREQ: 'Q' }, { UNIT_MULT: '3' }, { SOURCE: 'National survey' }]
    for (const change of changes)
      expect(() => normalizeIlo([{ ...row('unemployment'), ...change }], 'unemployment', countries, 2025)).toThrow('inesperado')
    expect(() => normalizeIlo([row('employment'), row('employment')], 'employment', countries, 2025)).toThrow('duplicado')
  })
  it('rejects an HTML error or malformed CSV', () => {
    expect(() => parseIloCsv('<html>Error</html>', 'unemployment')).toThrow('CSV OIT inválido')
    expect(() => parseIloCsv('DATAFLOW,REF_AREA\nwrong,BRA,extra', 'unemployment')).toThrow('CSV OIT inválido')
  })
})
