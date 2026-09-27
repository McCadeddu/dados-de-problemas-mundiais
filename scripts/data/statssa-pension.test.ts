import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import Papa from 'papaparse'
import type { SouthAfricaPension } from '../../src/types.js'
import { parseStatsSaPension, pensionCsv } from './statssa-pension.js'

const original = JSON.parse(readFileSync('scripts/data/sources/statssa-pension-2024.json', 'utf8')) as SouthAfricaPension
describe('Stats SA employer pension contribution', () => {
  it('preserves the reviewed six-year series and published total, rather than averaging sexes', () => {
    const data = parseStatsSaPension(original)
    expect(data.points).toHaveLength(6)
    expect(data.points[0]).toEqual({ year: 2019, bothSexes: 48.2, men: 50.4, women: 45.6 })
    expect(data.points.at(-1)).toEqual({ year: 2024, bothSexes: 44.8, men: 45.8, women: 43.6 })
    expect(data.points[0].bothSexes).not.toBe((data.points[0].men + data.points[0].women) / 2)
  })
  it.each(['missing-year', 'duplicate-year', 'future-year', 'missing-value', 'out-of-range', 'wrong-total', 'wrong-population', 'wrong-measure', 'wrong-unit', 'wrong-table', 'missing-hash'])('rejects %s before publication', (scenario) => {
    const data = structuredClone(original)
    if (scenario === 'missing-year') data.points.pop()
    if (scenario === 'duplicate-year') data.points[1].year = 2019
    if (scenario === 'future-year') data.points[5].year = 2025
    if (scenario === 'missing-value') data.points[0].women = null as unknown as number
    if (scenario === 'out-of-range') data.points[0].men = 101
    if (scenario === 'wrong-total') data.points[0].bothSexes = 20
    if (scenario === 'wrong-population') data.population = 'all-employed' as 'employees'
    if (scenario === 'wrong-measure') data.measure = 'any-contribution' as 'employer-pension-contribution'
    if (scenario === 'wrong-unit') data.unit = 'people' as '%'
    if (scenario === 'wrong-table') data.table = '3.29'
    if (scenario === 'missing-hash') data.sha256 = ''
    expect(() => parseStatsSaPension(data)).toThrow(/Stats SA pensão/)
  })
  it('exports the same 18 observations with denominator, edition and publication date', () => {
    const csv = Papa.parse<Record<string, string>>(pensionCsv(original), { header: true, skipEmptyLines: true })
    expect(csv.errors).toEqual([])
    expect(csv.data).toHaveLength(6)
    csv.data.forEach((row, index) => {
      const point = original.points[index]
      expect([Number(row.ano), Number(row.ambos_os_sexos), Number(row.homens), Number(row.mulheres)])
        .toEqual([point.year, point.bothSexes, point.men, point.women])
      expect(row.denominador).toContain('empregados')
      expect(row.publicacao).toBe('2025-12-10')
      expect(row.fonte).toBe(original.documentUrl)
    })
  })
})
