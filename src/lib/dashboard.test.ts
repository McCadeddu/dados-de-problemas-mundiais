import { describe, expect, it } from 'vitest'
import { formatValue, getMetricSummary, getPopulationWeightedAverage, getSafeThemeId, getTopRanked } from './dashboard'
import type { DashboardData } from '../types'

const fixture: DashboardData = {
  generatedAt: '2026-09-04T00:00:00.000Z',
  themes: [],
  indicators: [
    {
      id: 'wb-basic-water',
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
    { indicatorId: 'wb-basic-water', geographyType: 'country', geographyCode: 'BRA', geographyName: 'Brasil', year: 2024, value: 10 },
    { indicatorId: 'wb-basic-water', geographyType: 'country', geographyCode: 'ARG', geographyName: 'Argentina', year: 2024, value: 20 },
  ],
  rankings: [
    {
      indicatorId: 'wb-basic-water',
      geographyType: 'country',
      year: 2024,
      items: [
        { indicatorId: 'wb-basic-water', geographyType: 'country', geographyCode: 'ARG', geographyName: 'Argentina', year: 2024, value: 20 },
        { indicatorId: 'wb-basic-water', geographyType: 'country', geographyCode: 'BRA', geographyName: 'Brasil', year: 2024, value: 10 },
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
  it('rejects counts, indexes, unreviewed ratios and unknown indicators by default', () => {
    for (const id of ['wb-gini', 'wb-poverty-685', 'nd-gain-index', 'wb-migrant-stock', 'unhcr-refugees-hosted', 'wb-undernourishment', 'wb-moderate-severe-food-insecurity', 'new-indicator']) {
      const data = { ...fixture, indicators: [{ ...fixture.indicators[0], id }] }
      expect(getPopulationWeightedAverage(data, fixture.latest.map(row => ({ ...row, indicatorId: id })))).toBeNull()
    }
  })
  it('rejects duplicates, mixed indicators, invalid percentages and non-country rows', () => {
    expect(getPopulationWeightedAverage(fixture, [fixture.latest[0], fixture.latest[0]])).toBeNull()
    expect(getPopulationWeightedAverage(fixture, [fixture.latest[0], { ...fixture.latest[1], indicatorId: 'other' }])).toBeNull()
    for (const value of [-1, 101, NaN, Infinity]) expect(getPopulationWeightedAverage(fixture, [{ ...fixture.latest[0], value }])).toBeNull()
    expect(getPopulationWeightedAverage(fixture, [{ ...fixture.latest[0], geographyType: 'brazil-state' }])).toBeNull()
  })
  it('keeps a true zero and reports only countries with a valid denominator', () => {
    expect(getPopulationWeightedAverage(fixture, [{ ...fixture.latest[0], value: 0 }])?.value).toBe(0)
    const data = { ...fixture, countryPopulation: fixture.countryPopulation.slice(0, 1) }
    expect(getPopulationWeightedAverage(data, fixture.latest)).toEqual({ value: 10, coverage: 1, firstYear: 2024, lastYear: 2024 })
  })
  it('does not create Gini aggregates using total population', () => {
    const data = { ...fixture, indicators: fixture.indicators.map((indicator) => ({ ...indicator, id: 'wb-gini', themeId: 'poverty-inequality' as const })) }
    expect(getPopulationWeightedAverage(data, fixture.latest)).toBeNull()
  })
  it('falls back to an available theme for an invalid shared link', () => {
    expect(getSafeThemeId({ ...fixture, themes: [{ id: 'hunger-water', name: 'Fome e sede', description: '' }] }, 'tema-removido')).toBe('hunger-water')
  })

  it('weights a geographic average by population from the same year', () => {
    expect(getPopulationWeightedAverage(fixture, fixture.latest)).toEqual({ value: 19, coverage: 2, firstYear: 2024, lastYear: 2024 })
  })

  it('rejects mixing reference years even when each has a population match', () => {
    const data = { ...fixture, countryPopulation: [
      { geographyCode: 'BRA', points: [{ year: 2020, value: 100 }] },
      { geographyCode: 'ARG', points: [{ year: 2024, value: 900 }] },
    ] }
    const values = [
      { ...fixture.latest[0], year: 2020 },
      fixture.latest[1],
      { ...fixture.latest[0], geographyCode: 'XXX', year: 2025 },
    ]
    expect(getPopulationWeightedAverage(data, values)).toBeNull()
  })

  it('returns no estimate when no matching population is available', () => {
    expect(getPopulationWeightedAverage({ ...fixture, countryPopulation: [] }, fixture.latest)).toBeNull()
  })

  it('formats percentages', () => {
    expect(formatValue(12.34, '%')).toBe('12,3%')
  })

  it('formats percentage-point gaps', () => {
    expect(formatValue(12.34, 'p.p.')).toBe('12,3 p.p.')
  })

  it('preserves precision for zero-to-one indexes', () => {
    expect(formatValue(0.489, 'índice 0-1')).toBe('0,489')
  })

  it('returns ranking slices', () => {
    expect(getTopRanked(fixture, 'wb-basic-water', 1)[0]?.geographyCode).toBe('ARG')
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
