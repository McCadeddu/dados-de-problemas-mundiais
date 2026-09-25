import { afterEach, describe, expect, it, vi } from 'vitest'
import { readSheet, type SheetData } from 'read-excel-file/node'
import { collectInegiUnemployment, parseInegiUnemployment } from './inegi.js'

vi.mock('read-excel-file/node', () => ({ readSheet: vi.fn() }))
function table(): SheetData {
  const rows: SheetData = Array.from({ length: 14 }, () => [])
  rows[0][0] = 'INEGI. Encuesta Nacional de Ocupación y Empleo (ENOE).'
  rows[3][0] = 'Nacional (Relativos)'
  rows[9][0] = '2. Población de 15 años y más'
  rows[10][1] = 'Tasas calculadas contra la población económicamente activa'
  rows[11][2] = 'Tasa de desocupación'
  rows[12] = [1, 'La cifra absoluta de población se ajusta a proyecciones.']
  rows[13] = ['Fuente: ENOE a partir de enero de 2023.']
  for (let i = 0; i < 44; i++) {
    rows[4][i + 5] = i % 12 === 0 ? 2023 + Math.floor(i / 12) : null
    rows[6][i + 5] = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i % 12]
    rows[11][i + 5] = 3.0107
  }
  return rows
}
afterEach(() => vi.restoreAllMocks())

describe('INEGI national ENOE unemployment', () => {
  it('preserves precision, zero, explicit absences and original methodological notes', () => {
    const rows = table()
    rows[11][5] = 0
    rows[11][6] = 'ND'
    const result = parseInegiUnemployment(rows)
    expect(result.points).toHaveLength(44)
    expect(result.points.slice(0, 2)).toEqual([{ period: '2023-01', value: 0 }, { period: '2023-02', value: null, status: 'ND' }])
    expect(result.points.at(-1)).toEqual({ period: '2026-08', value: 3.0107 })
    expect(result.sourceNotes[0]).toContain('La cifra absoluta')
  })
  it('rejects a different population, unexpected numbers, missing months and lost metadata', () => {
    for (const [row, col, value] of [[3, 0, 'Hombres (Relativos)'], [9, 0, '14 años'], [11, 5, 101], [11, 5, -1],
      [11, 5, null], [11, 5, '3,0'], [6, 6, 'Ene'], [4, 17, 2025], [13, 0, 'Unknown']] as const) {
      const rows = table()
      rows[row][col] = value
      expect(() => parseInegiUnemployment(rows)).toThrow()
    }
  })
  it('downloads the national relative sheet and retains the last snapshot on failure or shrinkage', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(readSheet).mockImplementation(async () => table() as never)
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response(new Uint8Array([1, 2])))
    const fresh = await collectInegiUnemployment(undefined, fetcher)
    expect(readSheet).toHaveBeenCalledWith(expect.any(Buffer), '1.2')
    expect(fresh.cached).toBe(false)
    const shorter = table().map((row) => row.slice(0, 48))
    vi.mocked(readSheet).mockImplementation(async () => shorter as never)
    expect(await collectInegiUnemployment(fresh, fetcher)).toMatchObject({ cached: true, fetchedAt: fresh.fetchedAt, points: fresh.points })
    const unavailable = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 404 }))
    expect(await collectInegiUnemployment(fresh, unavailable)).toMatchObject({ cached: true, fetchedAt: fresh.fetchedAt, points: fresh.points })
    await expect(collectInegiUnemployment(undefined, unavailable)).rejects.toThrow()
  })
})
