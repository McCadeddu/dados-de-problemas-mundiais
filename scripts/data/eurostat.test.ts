import { describe, expect, it } from 'vitest'
import { parsePoverty, POVERTY_FILTERS, type JsonStat } from './eurostat.js'

function fixture(): JsonStat {
  return {
    updated: '2026-09-17',
    id: [...Object.keys(POVERTY_FILTERS), 'geo', 'time'],
    size: [1, 1, 1, 1, 1, 1, 3, 2],
    dimension: {
      ...Object.fromEntries(Object.entries(POVERTY_FILTERS).map(([id, code]) => [id, { category: { index: { [code]: 0 } } }])),
      geo: { category: { index: { EU27_2020: 0, PT: 1, UK: 2 } } },
      time: { category: { index: { '2023': 0, '2024': 1 } } },
    },
    value: { 0: 16, 1: 17, 2: 0, 3: 16.6, 4: 19 },
    status: { 3: 'bp' },
  }
}

describe('Eurostat national poverty connector', () => {
  it('excludes aggregates and territories outside the reuse scope; preserves zeros and flags', () => {
    expect(parsePoverty(fixture())).toEqual([{ countryCode: 'PRT', points: [
      { year: 2023, value: 0 }, { year: 2024, value: 16.6, status: 'bp' },
    ] }])
  })
  it('does not turn missing observations into zero', () => {
    const data = fixture()
    data.value = { 3: null }
    expect(parsePoverty(data)).toEqual([])
  })
  it('rejects a response for a different poverty definition', () => {
    const data = fixture()
    data.dimension.rskpovth.category.index = { B_50: 0 }
    expect(() => parsePoverty(data)).toThrow('rskpovth')
  })
  it('decodes dimension order instead of assuming geo comes before time', () => {
    const data = fixture()
    data.id = [...Object.keys(POVERTY_FILTERS), 'time', 'geo']
    data.size = [1, 1, 1, 1, 1, 1, 2, 3]
    data.value = { 1: 10, 4: 11 }
    data.status = {}
    expect(parsePoverty(data)[0].points).toEqual([{ year: 2023, value: 10 }, { year: 2024, value: 11 }])
  })
  it('rejects invalid percentages', () => {
    const data = fixture()
    data.value = { 2: 101 }
    expect(() => parsePoverty(data)).toThrow('inválida')
  })
})
