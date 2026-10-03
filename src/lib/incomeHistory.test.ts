import { expect, it } from 'vitest'
import Papa from 'papaparse'
import { incomeHistoryCsv, incomeHistoryRows } from './incomeHistory.js'
import { parseIncomeFootnote, type IncomeDistribution } from './incomeDistribution.js'

const note = 'Based on data from OLD. Estimated from unit-record income data.'
const next = 'Based on data from NEW. Estimated from grouped consumption data. Urban only.'
const fixture = { fetchedAt: '2026-10-02', sourceUpdatedAt: '2026-07-13', cached: false, licenseUrl: 'https://data.worldbank.org/',
  indicators: [{ id: 'wb-income-top-10', requestUrl: 'https://api.worldbank.org/' }], series: [{ indicatorId: 'wb-income-top-10', countryCode: 'BRA',
    points: [
      { year: 2024, value: 30, sourceFootnote: next, sourceIncomeMetadata: parseIncomeFootnote(next) },
      { year: 2021, value: 0, sourceFootnote: note, sourceIncomeMetadata: parseIncomeFootnote(note) },
      { year: 2022, value: null },
      { year: 2025, value: 40, sourceFootnote: next, sourceIncomeMetadata: parseIncomeFootnote(next) },
    ] }] } as IncomeDistribution

it('retains zero and missing years, compares only within a series and distinguishes metadata from value changes', () => {
  const rows = incomeHistoryRows(fixture)
  expect(rows.map(r => [r.year, r.status])).toEqual([[2021, 'initial'], [2022, 'absent'], [2024, 'changed'], [2025, 'unchanged']])
  expect(rows[2].previousYear).toBe(2021)
  expect(rows[2].gapYears).toBe(3)
  expect(rows[2].changes).toEqual(['sigla da pesquisa', 'conceito de renda/consumo', 'microdados/dados agrupados', 'restrição declarada de cobertura'])
  expect(fixture.series[0].points[0].year).toBe(2024)
  const second = { ...fixture, series: [...fixture.series, { ...fixture.series[0], indicatorId: 'wb-income-bottom-20' }] }
  expect(incomeHistoryRows(second).filter(r => r.status === 'initial')).toHaveLength(2)
})
it('does not infer stability or bridge an observation whose metadata is unknown', () => {
  const data = { ...fixture, series: [{ ...fixture.series[0], points: [
    { year: 2020, value: 1, status: '', sourceFootnote: note, sourceIncomeMetadata: parseIncomeFootnote(note) },
    { year: 2021, value: 2, status: '', sourceFootnote: 'unrecognized note' },
    { year: 2022, value: 3, status: '', sourceFootnote: note, sourceIncomeMetadata: parseIncomeFootnote(note) },
  ] }] }
  expect(incomeHistoryRows(data).map(r => r.status)).toEqual(['initial', 'unknown', 'unknown'])
  expect(incomeHistoryRows(data)[2].previousYear).toBe(2021)
})
it('exports missing versus zero, the actual interval, both notes and source provenance', () => {
  const rows = Papa.parse<Record<string, string>>(incomeHistoryCsv(fixture), { header: true, skipEmptyLines: true }).data
  expect(rows[0].valor_percentual).toBe('0')
  expect(rows[1].valor_percentual).toBe('')
  expect(rows[2].intervalo_anos).toBe('3')
  expect(rows[2].nota_wdi_anterior).toBe(note)
  expect(rows[2].nota_wdi_atual).toBe(next)
  expect(rows[2].coleta_wdi).toBe(fixture.fetchedAt)
})
