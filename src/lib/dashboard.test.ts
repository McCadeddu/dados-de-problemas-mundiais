import { describe, expect, it } from 'vitest'
import { formatValue, getMetricSummary, getPopulationWeightedAverage, getSafeThemeId, getTopRanked } from './dashboard'
import type { DashboardData } from '../types'

const fixture: DashboardData = {
  generatedAt: '2026-09-04T00:00:00.000Z',
  themes: [],
  indicators: [
    {
      id: 'a',
      name: 'A',
      themeId: 'hunger-water',
      description: '',
      unit: '%',
      geographyType: 'country',
      sourceId: 's',
      direction: 'higher-worse',
      latestYear: 2024,
    },
  ],
  sources: [],
  countries: [{ code: 'BRA', name: 'Brasil', continent: 'América do Sul' }],
  continents: ['América do Sul'],
  brazilStates: [{ code: '35', name: 'São Paulo' }],
  brazilImmediateRegions: [],
  series: [],
  latest: [
    { indicatorId: 'a', geographyType: 'country', geographyCode: 'BRA', geographyName: 'Brasil', year: 2024, value: 10 },
    { indicatorId: 'a', geographyType: 'country', geographyCode: 'ARG', geographyName: 'Argentina', year: 2024, value: 20 },
  ],
  rankings: [
    {
      indicatorId: 'a',
      geographyType: 'country',
      year: 2024,
      items: [
        { indicatorId: 'a', geographyType: 'country', geographyCode: 'ARG', geographyName: 'Argentina', year: 2024, value: 20 },
        { indicatorId: 'a', geographyType: 'country', geographyCode: 'BRA', geographyName: 'Brasil', year: 2024, value: 10 },
      ],
    },
  ],
  countryPopulation: [
    { geographyCode: 'BRA', points: [{ year: 2024, value: 100 }] },
    { geographyCode: 'ARG', points: [{ year: 2024, value: 900 }] },
  ],
  notes: [],
}

describe('dashboard helpers', () => {
  it('falls back to an available theme for an invalid shared link', () => {
    expect(getSafeThemeId({ ...fixture, themes: [{ id: 'hunger-water', name: 'Fome e sede', description: '' }] }, 'tema-removido')).toBe('hunger-water')
  })

  it('weights a geographic average by population from the same year', () => {
    expect(getPopulationWeightedAverage(fixture, fixture.latest)).toEqual({ value: 19, coverage: 2 })
  })

  it('formats percentages', () => {
    expect(formatValue(12.34, '%')).toBe('12.3%')
  })

  it('formats percentage-point gaps', () => {
    expect(formatValue(12.34, 'p.p.')).toBe('12.3 p.p.')
  })

  it('preserves precision for zero-to-one indexes', () => {
    expect(formatValue(0.489, 'índice 0-1')).toBe('0.489')
  })

  it('returns ranking slices', () => {
    expect(getTopRanked(fixture, 'a', 1)[0]?.geographyCode).toBe('ARG')
  })

  it('summarizes coverage', () => {
    expect(getMetricSummary(fixture)).toEqual({
      countries: 1,
      states: 1,
      countryIndicators: 1,
      brazilIndicators: 0,
    })
  })
})
