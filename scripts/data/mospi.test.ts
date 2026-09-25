import { afterEach, describe, expect, it, vi } from 'vitest'
import { collectMospiUnemployment, MOSPI_URL, parseMospiUnemployment } from './mospi.js'

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
function rows(count = 17) {
  return Array.from({ length: count }, (_, i) => ({
    frequency: 'Monthly', indicator: 'UR (Unemployment Rate, in per cent)',
    year: String(2025 + Math.floor((i + 3) / 12)), month: months[(i + 3) % 12],
    state: 'All India', AgeGroup: '15 years and above', gender: 'person', sector: 'rural + urban', unit: '%', value: '5.1',
  }))
}
function response(data: unknown[], page = 1, totalRecords = data.length) {
  return Response.json({ statusCode: true, data, meta_data: { page, totalRecords, totalPages: Math.ceil(totalRecords / 100), recordPerPage: 100 } })
}
afterEach(() => vi.restoreAllMocks())

describe('MoSPI monthly PLFS unemployment', () => {
  it('sorts the monthly history and preserves zero and source precision', () => {
    const data = rows()
    data[0].value = '0'
    data[16].value = '5.0123'
    const points = parseMospiUnemployment(data.reverse())
    expect(points).toHaveLength(17)
    expect(points[0]).toEqual({ period: '2025-04', value: 0 })
    expect(points.at(-1)).toEqual({ period: '2026-08', value: 5.0123 })
  })
  it('rejects changes of population, period, measure, unit, missing values and duplicate months', () => {
    const bad: Array<[string, unknown]> = [
      ['frequency', 'Annual'], ['indicator', 'LFPR'], ['state', 'Delhi'], ['AgeGroup', 'All ages'],
      ['gender', 'male'], ['sector', 'urban'], ['unit', 'Number'], ['month', 'Q1'], ['year', '2025-26'],
      ['value', null], ['value', ''], ['value', '-'], ['value', 'NaN'], ['value', -1], ['value', '101'],
    ]
    for (const [key, value] of bad) {
      const data: Array<Record<string, unknown>> = rows()
      data[0][key] = value
      expect(() => parseMospiUnemployment(data)).toThrow()
    }
    expect(() => parseMospiUnemployment([...rows(), rows()[0]])).toThrow(/duplicado/)
    expect(() => parseMospiUnemployment(rows().slice(1))).toThrow(/cobertura/)
    expect(() => parseMospiUnemployment([null, ...rows()])).toThrow(/recorte/)
  })
  it('fetches all pages, allowing published revisions without mixing populations', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2035-01-01'))
    try {
      const data = rows(101)
      const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(response(data.slice(0, 100), 1, 101)).mockResolvedValueOnce(response(data.slice(100), 2, 101))
      const result = await collectMospiUnemployment(undefined, fetcher)
      expect(result.points).toHaveLength(101)
      expect(result.cached).toBe(false)
      expect(new URL(String(fetcher.mock.calls[0][0])).searchParams.has('year_type_code')).toBe(false)
      expect(new URL(String(fetcher.mock.calls[1][0])).searchParams.get('page')).toBe('2')
      expect(result.requestUrl).toBe(MOSPI_URL)
    } finally { vi.useRealTimers() }
  })
  it('keeps the original snapshot on API errors, partial pagination, invalid rows or coverage loss', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fresh = await collectMospiUnemployment(undefined, vi.fn<typeof fetch>().mockResolvedValue(response(rows())))
    const previous = { ...fresh, fetchedAt: '2026-09-24T12:00:00Z' }
    for (const broken of [
      Response.json({ statusCode: false, data: [] }), new Response('', { status: 404 }),
      response(rows(), 1, 18), response(rows(), 2), response(rows(16)),
      response([...rows().slice(0, 16), { ...rows()[16], value: '' }]),
    ]) {
      const cached = await collectMospiUnemployment(previous, vi.fn<typeof fetch>().mockResolvedValue(broken))
      expect(cached).toMatchObject({ cached: true, points: previous.points, fetchedAt: previous.fetchedAt })
      expect(cached.lastAttemptAt).not.toBe(previous.fetchedAt)
    }
    const revised = rows()
    revised[0].value = '5.2'
    expect((await collectMospiUnemployment(previous, vi.fn<typeof fetch>().mockResolvedValue(response(revised)))).points[0].value).toBe(5.2)
    const newer = { ...previous, points: [...previous.points, { period: '2026-09', value: 5 }] }
    expect((await collectMospiUnemployment(newer, vi.fn<typeof fetch>().mockResolvedValue(response(rows())))).cached).toBe(true)
    await expect(collectMospiUnemployment(undefined, vi.fn<typeof fetch>().mockResolvedValue(Response.json({})))).rejects.toThrow(/resposta/)
  })
})
