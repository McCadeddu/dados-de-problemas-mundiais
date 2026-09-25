import { afterEach, describe, expect, it, vi } from 'vitest'
import { readSheet, type SheetData } from 'read-excel-file/node'
import { collectStatsSaUnemployment, parseStatsSaUnemployment } from './statssa.js'

vi.mock('read-excel-file/node', () => ({ readSheet: vi.fn() }))
function table(): SheetData {
  return [
    ['Table 2: Labour force characteristics by sex - All population groups'],
    [null, ...Array.from({ length: 74 }, (_, i) => `${['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'][i % 4]} ${2008 + Math.floor(i / 4)}`)],
    ['Both sexes'], ['Population 15-64 years'], ['Labour underutilization indicators (%)'],
    ['LU1- Unemployment rate', ...Array.from({ length: 74 }, (_, i) => i === 73 ? 33.6 : 23.2)],
    ['Women'], ['LU1- Unemployment rate', ...Array(74).fill(37.5)],
    ['Men'], ['LU1- Unemployment rate', ...Array(74).fill(30.3)],
    ['For all values of 10 000 or lower the sample size is too small for reliable estimates.'],
    ['Due to rounding, numbers do not necessarily add up to totals.'],
  ]
}
afterEach(() => vi.restoreAllMocks())

describe('Stats SA QLFS unemployment', () => {
  it('selects total LU1, keeps zero and source precision, and preserves notes', () => {
    const rows = table()
    rows[5][1] = 0
    rows[5][2] = 23.2345
    const result = parseStatsSaUnemployment(rows)
    expect(result.points).toHaveLength(74)
    expect(result.points[0]).toEqual({ period: '2008-Q1', value: 0 })
    expect(result.points[1]).toEqual({ period: '2008-Q2', value: 23.2345 })
    expect(result.points.at(-1)).toEqual({ period: '2026-Q2', value: 33.6 })
    expect(result.sourceNotes).toHaveLength(2)
  })
  it('rejects a different population, unit or indicator, duplicate periods and absent values', () => {
    const invalid: Array<[number, number, string | number | null]> = [
      [0, 0, 'Provincial table'], [2, 0, 'Women'], [3, 0, 'Population 15-24 years'], [4, 0, 'Thousand'],
      [5, 0, 'LU3 - Combined rate'], [1, 2, 'Jan-Mar 2008'], [1, 74, 'Jul-Sep 2026'],
      [5, 1, null], [5, 1, '-'], [5, 1, '33.6'], [5, 1, -1], [5, 1, 101], [10, 0, ''],
    ]
    for (const [row, col, value] of invalid) {
      const rows = table()
      rows[row][col] = value
      expect(() => parseStatsSaUnemployment(rows)).toThrow()
    }
    const duplicate = table()
    duplicate.splice(5, 0, [...duplicate[5]])
    expect(() => parseStatsSaUnemployment(duplicate)).toThrow(/indicador/)
  })
  it('fetches the reviewed sheet and retains the original snapshot on block pages, errors or coverage loss', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(readSheet).mockImplementation(async () => table() as never)
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response(new Uint8Array([0x50, 0x4b])))
    const fresh = await collectStatsSaUnemployment(undefined, fetcher)
    expect(readSheet).toHaveBeenCalledWith(expect.any(Buffer), 'Table 2')
    expect(fresh).toMatchObject({ cached: false, edition: '2026-Q2', sourceUpdatedAt: '2026-08-11' })
    for (const response of [new Response('<html>security check</html>'), new Response('', { status: 404 })]) {
      const cached = await collectStatsSaUnemployment(fresh, vi.fn<typeof fetch>().mockResolvedValue(response))
      expect(cached).toMatchObject({ cached: true, fetchedAt: fresh.fetchedAt, sourceUpdatedAt: fresh.sourceUpdatedAt, points: fresh.points })
    }
    const shorter = table().map((row) => row.slice(0, 74))
    vi.mocked(readSheet).mockImplementation(async () => shorter as never)
    expect(await collectStatsSaUnemployment(fresh, fetcher)).toMatchObject({ cached: true, points: fresh.points })
    await expect(collectStatsSaUnemployment(undefined, fetcher)).rejects.toThrow(/cobertura/)
  })
})
