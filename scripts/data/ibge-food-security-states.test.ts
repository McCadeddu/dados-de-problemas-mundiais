import { describe, expect, it, vi } from 'vitest'
import type { DashboardData } from '../../src/types.js'
import { collectStateFoodSecurity, integrateStateFoodSecurity, parseStateFoodSecurity, STATE_CODES } from './ibge-food-security-states.js'

const fixture = (years = [2023, 2024]) => [{}, ...STATE_CODES.flatMap((code) => years.flatMap((year) => ['109099', '109101', '109102'].map((category, index) => ({ NC: '3', MN: '%', D1C: code, D1N: `UF ${code}`, D2C: '9784', D3C: String(year), D4C: '6795', D5C: category, V: ['24.2', '4.5', '3.2'][index] }))))]
const fetchRows = (rows: unknown) => vi.fn<typeof fetch>().mockResolvedValue(Response.json(rows))

describe('IBGE food security by state', () => {
  it('maps the 27 UFs, 3 categories and 2 years with explicit household percentages', () => {
    const series = parseStateFoodSecurity(fixture())
    expect(series).toHaveLength(81)
    expect(series.find((entry) => entry.geographyCode === '53' && entry.indicatorId === 'ibge-state-food-insecurity-severe')?.points).toEqual([{ year: 2023, value: 3.2 }, { year: 2024, value: 3.2 }])
  })
  it('rejects missing states/categories, duplicates, suppression and wrong dimensions without inventing zeros', () => {
    const rows = fixture()
    for (const invalid of [rows.slice(0, -1), [...rows, rows[1]], [{}, ...rows.slice(1).filter((row) => !('D1C' in row) || row.D1C !== '53')]]) expect(() => parseStateFoodSecurity(invalid)).toThrow()
    for (const change of [{ V: '...' }, { V: '101' }, { V: '1' }, { D1C: '99' }, { NC: '1' }, { D2C: '10117' }, { D4C: '1' }, { MN: 'Mil unidades' }]) {
      const invalid = fixture(); invalid[1] = { ...invalid[1], ...change }
      expect(() => parseStateFoodSecurity(invalid)).toThrow()
    }
  })
  it('preserves a complete prior collection on a bad response or loss of any previous year', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const previous = await collectStateFoodSecurity(undefined, fetchRows(fixture([2023, 2024, 2025])))
      for (const rows of [[], fixture([2023, 2024, 2026])]) {
        const result = await collectStateFoodSecurity(previous, fetchRows(rows))
        expect(result).toMatchObject({ cached: true, series: previous.series, fetchedAt: previous.fetchedAt })
      }
      await expect(collectStateFoodSecurity(undefined, fetchRows([]))).rejects.toThrow()
    } finally { warn.mockRestore() }
  })
  it('replaces its own data idempotently and leaves other indicators intact', async () => {
    const collection = await collectStateFoodSecurity(undefined, fetchRows(fixture()))
    const unrelated = { id: 'water' }
    const data = { indicators: [unrelated], sources: [], latest: [], rankings: [] } as unknown as DashboardData
    const next = integrateStateFoodSecurity(data, collection)
    expect(next.indicators).toHaveLength(4)
    expect(next.indicators[0]).toBe(unrelated)
    expect(next.latest).toHaveLength(81)
    expect(next.rankings.every((entry) => entry.items.length === 27 && entry.year === 2024)).toBe(true)
    expect(integrateStateFoodSecurity(next, collection)).toEqual(next)
    expect(integrateStateFoodSecurity(data, { ...collection, cached: true }).sources[0].lastUpdated).toContain('Última tentativa falhou')
  })
})
