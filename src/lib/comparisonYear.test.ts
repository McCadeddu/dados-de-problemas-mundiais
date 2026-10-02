import { expect, it } from 'vitest'
import type { DashboardData, Series } from '../types'
import { comparisonSnapshot, permitsCountryRanking } from './comparisonYear'
import { parseIncomeFootnote } from './incomeDistribution'
const series = (code: string, points: Series['points']): Series => ({ indicatorId: 'x', geographyType: 'country', geographyCode: code, geographyName: code, points })
const fixture = {
  countries: [{ code: 'BRA', name: 'Brasil', continent: 'América do Sul' }, { code: 'ARG', name: 'Argentina', continent: 'América do Sul' }, { code: 'PRT', name: 'Portugal', continent: 'Europa' }],
  series: [series('BRA', [{ year: 2023, value: 5 }, { year: 2024, value: 0 }]), series('ARG', [{ year: 2023, value: 8 }]), series('PRT', [{ year: 2024, value: 2 }])],
} as DashboardData
it('keeps zero and excludes missing countries without borrowing their latest year', () => {
  const result = comparisonSnapshot(fixture, 'x', 2024, 'América do Sul')
  expect(result.values.map(r => [r.geographyCode, r.value, r.year])).toEqual([['BRA', 0, 2024]])
  expect(result.excluded.map(r => r.code)).toEqual(['ARG'])
  expect(result.total).toBe(2)
  expect(comparisonSnapshot(fixture, 'x', 2023, 'Todos').values).toHaveLength(2)
})
it('falls back to the latest available year on an unavailable selection, never to mixed latest values', () => {
  expect(comparisonSnapshot(fixture, 'x', 2000, 'Todos').year).toBe(2024)
  expect(comparisonSnapshot(fixture, 'other', 2024, 'Todos').values).toEqual([])
})
it('excludes duplicate and non-finite observations', () => {
  const broken = { ...fixture, series: [...fixture.series, series('BRA', [{ year: 2024, value: 0 }]), series('ARG', [{ year: 2024, value: NaN }])] }
  expect(comparisonSnapshot(broken, 'x', 2024, 'Todos').values.map(r => r.geographyCode)).toEqual(['PRT'])
})
it('does not rank modeled labour series without imputation flags', () => {
  expect(permitsCountryRanking('ilo-unemployment')).toBe(false)
  expect(permitsCountryRanking('wb-female-labor')).toBe(false)
  expect(permitsCountryRanking('wb-basic-water')).toBe(true)
})
it('filters income shares by documented concept in the selected year without inferring missing metadata', () => {
  const income = parseIncomeFootnote('Based on data from PNADC-E1. Estimated from unit-record income data.')!
  const consumption = parseIncomeFootnote('Based on data from HBS. Estimated from unit-record consumption data.')!
  const filtered = { ...fixture, series: [
    { ...series('BRA', [{ year: 2024, value: 0, sourceIncomeMetadata: income }, { year: 2023, value: 20, sourceIncomeMetadata: consumption }]), indicatorId: 'wb-income-top-10' },
    { ...series('ARG', [{ year: 2024, value: 30, sourceIncomeMetadata: { ...income, coverageRestriction: 'urban-only' } }]), indicatorId: 'wb-income-top-10' },
    { ...series('PRT', [{ year: 2024, value: 40 }]), indicatorId: 'wb-income-top-10' },
  ] }
  expect(comparisonSnapshot(filtered, 'wb-income-top-10', 2024, 'Todos', 'income').values.map(r => [r.geographyCode, r.value])).toEqual([['BRA', 0]])
  const empty = comparisonSnapshot(filtered, 'wb-income-top-10', 2024, 'Todos', 'consumption')
  expect(empty.year).toBe(2024)
  expect(empty.values).toEqual([])
  expect(comparisonSnapshot(filtered, 'wb-income-top-10', 2023, 'Todos', 'consumption').values.map(r => r.geographyCode)).toEqual(['BRA'])
  expect(comparisonSnapshot(filtered, 'wb-income-top-10', 2024, 'Todos').values).toHaveLength(3)
})
