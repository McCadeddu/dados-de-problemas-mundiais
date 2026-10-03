import { describe, expect, it } from 'vitest'
import { collectionStatus, observedCoverage, scopeCoverage, type CoverageDataset } from './coverageStatus'

const dataset: CoverageDataset = { id: 'water', name: 'Água', themeId: 'hunger-water', scope: 'country', file: 'water.json', available: true, territories: ['BRA'] }
describe('coverage and collection status', () => {
  it('counts zero, ignores null/invalid observations and keeps actual reference periods', () => {
    expect(observedCoverage([{ code: 'BRA', points: [{ year: 2024, value: 0 }, { year: 2025, value: null }] },
      { code: 'IND', points: [{ year: 2024, value: NaN }] }, { code: 'PRT', points: [{ period: '2026-Q2', value: 5 }] }]))
      .toEqual({ territories: ['BRA', 'PRT'], firstPeriod: '2024', lastPeriod: '2026-Q2' })
  })
  it('does not infer collection or freshness from processing dates', () => {
    expect(collectionStatus({ ...dataset, processedAt: '2026-10-03' })).toBe('Data de coleta não informada')
    expect(collectionStatus({ ...dataset, reviewedAt: '2026-10-03' })).toBe('Revisão documental registrada')
  })
  it('shows cached data even when the last attempt is more recent', () => {
    expect(collectionStatus({ ...dataset, cached: true, fetchedAt: '2026-09-29', lastAttemptAt: '2026-10-03' })).toBe('Coleta anterior (cache)')
    expect(collectionStatus({ ...dataset, available: false, cached: true })).toBe('Arquivo indisponível')
  })
  it('counts territories once and separates registered datasets without data', () => {
    const result = scopeCoverage([dataset, { ...dataset, id: 'water2', territories: ['BRA', 'IND'] },
      { ...dataset, id: 'empty', territories: [] }, { ...dataset, id: 'missing', available: false },
      { ...dataset, id: 'other', themeId: 'decent-work' }], 'hunger-water', 'country')
    expect(result).toEqual({ datasets: 2, registered: 4, territories: 2 })
  })
})
