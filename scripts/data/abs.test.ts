import { afterEach, describe, expect, it, vi } from 'vitest'
import { collectAbsUnemployment, parseAbsUnemployment } from './abs.js'

const header = 'DATAFLOW,MEASURE,SEX,AGE,TSEST,REGION,FREQ,TIME_PERIOD,OBS_VALUE,UNIT_MEASURE,UNIT_MULT,OBS_STATUS,OBS_COMMENT,DECIMALS'
const row = (period = '2026-07', value = '4.46182469') => `ABS:LF(1.0.0),M13,3,1599,20,AUS,M,${period},${value},PCT,0,,,1`
const csv = (...rows: string[]) => [header, ...rows].join('\n')
const fullCsv = csv(...Array.from({ length: 120 }, (_, i) => row(`${2015 + Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, '0')}`)))
const response = (text: string) => vi.fn<typeof fetch>().mockResolvedValue(new Response(text))
afterEach(() => vi.restoreAllMocks())

describe('ABS national unemployment', () => {
  it('preserves source precision, nulls, genuine zero and source flags, sorted by month', () => {
    expect(parseAbsUnemployment(csv(row(), row('2026-06', '').replace('PCT,0,,,1', 'PCT,0,M,"missing, source note",1'), row('2026-05', '0')))).toEqual([
      { period: '2026-05', value: 0 },
      { period: '2026-06', value: null, status: 'M', comment: 'missing, source note' },
      { period: '2026-07', value: 4.46182469 },
    ])
  })
  it.each([
    row().replace(',20,', ',10,'), row().replace(',AUS,', ',1,'),
    row().replace(',1599,', ',1524,'), row().replace(',PCT,', ',PSN,'),
    row().replace('PCT,0', 'PCT,3'), row('2026-13'), row('2014-12'),
    row('2026-07', 'NaN'), row('2026-07', '101'), row('2026-07', '-1'),
  ])('rejects incompatible selection, period or value: %s', (badRow) => {
    expect(() => parseAbsUnemployment(csv(badRow))).toThrow()
  })
  it('rejects duplicate periods, empty data and missing columns', () => {
    expect(() => parseAbsUnemployment(csv(row(), row()))).toThrow(/duplicado/)
    expect(() => parseAbsUnemployment(csv(row('2026-07', '')))).toThrow(/sem valores/)
    expect(() => parseAbsUnemployment('TIME_PERIOD,OBS_VALUE\n2026-07,4.5')).toThrow(/estrutura/)
  })
  it('collects sufficient history and preserves the last valid snapshot on errors', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fresh = await collectAbsUnemployment(undefined, response(fullCsv))
    expect(fresh.cached).toBe(false)
    expect(fresh.points).toHaveLength(120)
    for (const fetcher of [vi.fn<typeof fetch>().mockRejectedValue(new Error('offline')), response(csv(row())), response(fullCsv.replaceAll(',20,', ',10,'))]) {
      const cached = await collectAbsUnemployment(fresh, fetcher)
      expect(cached.cached).toBe(true)
      expect(cached.fetchedAt).toBe(fresh.fetchedAt)
      expect(cached.points).toEqual(fresh.points)
    }
  })
  it('fails instead of fabricating a first snapshot', async () => {
    await expect(collectAbsUnemployment(undefined, response(csv(row())))).rejects.toThrow(/cobertura/)
    await expect(collectAbsUnemployment(undefined, vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 503 })))).rejects.toThrow(/503/)
  })
})
