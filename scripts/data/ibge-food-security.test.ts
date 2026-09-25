import { afterEach, describe, expect, it, vi } from 'vitest'
import { collectIbgeFoodSecurity, parseIbgeFoodSecurity } from './ibge-food-security.js'

type FixtureRow = { D1C: string; D2C: string; D3C: string; D4C: string; V: string; MN: string }
const rows = (years = [2023, 2024]): FixtureRow[] => [
  { D1C: 'Brasil (Código)', D2C: 'Variável (Código)', D3C: 'Ano (Código)', D4C: 'Situação (Código)', V: 'Valor', MN: 'Unidade' },
  ...years.flatMap((year) => [
    { D1C: '1', D2C: '800', D3C: String(year), D4C: '109099', V: year === 2023 ? '27.6' : '24.2', MN: '%' },
    { D1C: '1', D2C: '800', D3C: String(year), D4C: '109101', V: year === 2023 ? '5.3' : '4.5', MN: '%' },
    { D1C: '1', D2C: '800', D3C: String(year), D4C: '109102', V: year === 2023 ? '4.1' : '3.2', MN: '%' },
  ]),
]
afterEach(() => vi.restoreAllMocks())

describe('IBGE food security', () => {
  it('groups official household percentages by year', () => {
    expect(parseIbgeFoodSecurity(rows())).toEqual([
      { year: 2023, foodInsecurity: 27.6, moderate: 5.3, severe: 4.1 },
      { year: 2024, foodInsecurity: 24.2, moderate: 4.5, severe: 3.2 },
    ])
  })
  it('rejects incomplete categories, invalid values, duplicates and changed dimensions', () => {
    for (const mutate of [
      (data: FixtureRow[]) => data.pop(),
      (data: FixtureRow[]) => { data[1].V = '101' },
      (data: FixtureRow[]) => { data[1].D1C = '2' },
      (data: FixtureRow[]) => { data[2].D4C = '109100' },
      (data: FixtureRow[]) => { data[4].D3C = '2023' },
    ]) {
      const data = rows(); mutate(data)
      expect(() => parseIbgeFoodSecurity(data)).toThrow()
    }
  })
  it('retains the previous snapshot on API or coverage failure', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fresh = await collectIbgeFoodSecurity(undefined, vi.fn<typeof fetch>().mockResolvedValue(Response.json(rows())))
    const cached = await collectIbgeFoodSecurity(fresh, vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 503 })))
    expect(cached).toMatchObject({ cached: true, points: fresh.points, fetchedAt: fresh.fetchedAt })
    await expect(collectIbgeFoodSecurity(undefined, vi.fn<typeof fetch>().mockResolvedValue(Response.json(rows().slice(0, 2))))).rejects.toThrow()
  }, 15000)
})
