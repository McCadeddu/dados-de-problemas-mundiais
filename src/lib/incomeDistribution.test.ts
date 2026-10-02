import { expect, it } from 'vitest'
import { parseIncomeFootnote, permitsIncomeConcept } from './incomeDistribution'

it('extracts only explicit WDI declarations and preserves urban restrictions', () => {
  const income = parseIncomeFootnote('Based on data from PNADC-E1. Estimated from unit-record income data.')!
  expect(income).toEqual({ surveyAcronym: 'PNADC-E1', welfareType: 'income', distributionType: 'unit-record', coverageRestriction: 'not-stated' })
  expect(permitsIncomeConcept(income, 'income')).toBe(true)
  expect(permitsIncomeConcept(income, 'consumption')).toBe(false)
  const urban = parseIncomeFootnote('Based on data from EPHC-S2. Estimated from unit-record income data. Urban only.')!
  expect(urban.coverageRestriction).toBe('urban-only')
  expect(permitsIncomeConcept(urban, 'income')).toBe(false)
  expect(permitsIncomeConcept(urban, 'all')).toBe(true)
  expect(parseIncomeFootnote('Based on data from HIES. Estimated from grouped consumption data.')?.welfareType).toBe('consumption')
})
it('does not guess concepts or coverage from missing, contradictory or new note formats', () => {
  for (const note of ['', 'Income survey', 'Based on data from X. Estimated from income and consumption data.', 'Based on data from X. Estimated from unit-record income data. Rural only.']) {
    expect(parseIncomeFootnote(note)).toBeUndefined()
  }
  expect(permitsIncomeConcept(undefined, 'income')).toBe(false)
  expect(permitsIncomeConcept(undefined, 'consumption')).toBe(false)
})
