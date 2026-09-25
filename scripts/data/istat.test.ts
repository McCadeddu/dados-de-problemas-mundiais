import Papa from 'papaparse'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { collectIstatUnemployment, parseIstatUnemployment } from './istat.js'

function row(overrides: Record<string, string> = {}) {
  return { DATAFLOW: 'IT1:151_874(1.0)', FREQ: 'M', REF_AREA: 'IT', DATA_TYPE: 'UNEM_R', ADJUSTMENT: 'Y',
    SEX: '9', AGE: 'Y15-74', EDITION: '2026M9G1', TIME_PERIOD: '2015-01', OBS_VALUE: '5.778043', OBS_STATUS: '',
    NOTE_DS: '', NOTE_REF_AREA: '', NOTE_DATA_TYPE: '', NOTE_ADJUSTMENT: '', NOTE_SEX: '', NOTE_AGE: '', NOTE_EDITION: '',
    NOTE_TIME_PERIOD: '', BASE_PER: '', UNIT_MEAS: '', UNIT_MULT: '', ...overrides }
}
const csv = (rows: ReturnType<typeof row>[]) => Papa.unparse(rows)
const history = () => Array.from({ length: 139 }, (_, i) => row({ TIME_PERIOD: `${2015 + Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, '0')}` }))
afterEach(() => vi.restoreAllMocks())

describe('Istat monthly unemployment', () => {
  it('selects the newest edition by date and never fills its gaps with older revisions', () => {
    const result = parseIstatUnemployment(csv([
      row({ EDITION: '2026M9G1', OBS_VALUE: '7' }),
      row({ EDITION: '2026M9G1', TIME_PERIOD: '2015-02', OBS_VALUE: '8' }),
      row({ EDITION: '2026M10G1', OBS_VALUE: '6.123456', OBS_STATUS: 'r' }),
    ]))
    expect(result).toEqual({ edition: '2026M10G1', sourceUpdatedAt: '2026-10-01',
      points: [{ period: '2015-01', value: 6.123456, status: 'r' }] })
  })
  it('preserves zero, missing flags and notes, rejecting duplicate months and wrong slices', () => {
    expect(parseIstatUnemployment(csv([row({ OBS_VALUE: '0' }), row({ TIME_PERIOD: '2015-02', OBS_VALUE: '', OBS_STATUS: 'c', NOTE_TIME_PERIOD: '123' })])).points)
      .toEqual([{ period: '2015-01', value: 0 }, { period: '2015-02', value: null, status: 'c', comment: 'NOTE_TIME_PERIOD: 123' }])
    const invalidChanges: Array<Record<string, string>> = [{ SEX: '1' }, { AGE: 'Y15-24' }, { FREQ: 'A' }, { ADJUSTMENT: 'N' }, { REF_AREA: 'ITC' },
      { UNIT_MULT: '3' }, { DATA_TYPE: 'UNEMP' }, { OBS_VALUE: '101' }, { OBS_VALUE: '-1' }, { OBS_VALUE: 'NaN' },
      { OBS_VALUE: '' }, { TIME_PERIOD: '2026-13' }, { EDITION: '2026M2G30' }, { EDITION: 'latest' }]
    for (const change of invalidChanges) {
      expect(() => parseIstatUnemployment(csv([row(change)]))).toThrow()
    }
    expect(() => parseIstatUnemployment(csv([row(), row()]))).toThrow(/duplicado/)
    expect(() => parseIstatUnemployment('unexpected,header\n1,2')).toThrow(/estrutura/)
  })
  it('collects one complete edition and retains the original dates on failure or lost coverage', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(csv(history())))
    const fresh = await collectIstatUnemployment(undefined, fetcher)
    expect(fetcher).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: expect.objectContaining({ 'Accept-Language': 'en' }) }))
    expect(fresh.points).toHaveLength(139)
    expect(fresh.points.at(-1)).toEqual({ period: '2026-07', value: 5.778043 })
    expect(fresh.cached).toBe(false)
    const cases = [
      new Response('', { status: 404 }),
      new Response(csv(history().filter((_, i) => i !== 20))),
      new Response(csv(history().slice(0, -1))),
      new Response(csv(history().map((r) => ({ ...r, EDITION: '2026M7G30' })))),
      new Response(csv([...history(), row({ EDITION: '2026M10G1' })])),
    ]
    for (const response of cases) {
      const cached = await collectIstatUnemployment(fresh, vi.fn<typeof fetch>().mockResolvedValue(response))
      expect(cached).toMatchObject({ cached: true, fetchedAt: fresh.fetchedAt, sourceUpdatedAt: fresh.sourceUpdatedAt, edition: fresh.edition, points: fresh.points })
    }
    await expect(collectIstatUnemployment(undefined, vi.fn<typeof fetch>().mockResolvedValue(new Response('bad')))).rejects.toThrow()
    await expect(collectIstatUnemployment(undefined, vi.fn<typeof fetch>().mockResolvedValue(new Response(csv(history().filter((_, i) => i !== 20)))))).rejects.toThrow(/cobertura/)
  })
})
