import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { DashboardData } from '../../src/types.js'
import { FEMINICIDE_COUNT_ID, FEMINICIDE_RATE_ID } from '../../src/lib/feminicide.js'
import { feminicideSeries, integrateFeminicide, parseFeminicideEdition, type FeminicideEdition } from './raseam-feminicide.js'

const original = JSON.parse(readFileSync('scripts/data/sources/raseam-2026-feminicide.json', 'utf8')) as FeminicideEdition
const copy = () => structuredClone(original)

describe('reviewed RASEAM feminicide edition', () => {
  it('reconciles both complete years, all 27 UFs, published rates and national totals', () => {
    const edition = parseFeminicideEdition(original)
    const series = feminicideSeries(edition)
    expect(series).toHaveLength(54)
    expect(series.every((entry) => entry.points.map((p) => p.year).join() === '2024,2025')).toBe(true)
    expect(series.find((entry) => entry.geographyCode === '12' && entry.indicatorId === FEMINICIDE_RATE_ID)?.points).toEqual([{ year: 2024, value: 1.8 }, { year: 2025, value: 3.2 }])
    expect(series.find((entry) => entry.geographyCode === '35' && entry.indicatorId === FEMINICIDE_COUNT_ID)?.points.at(-1)?.value).toBe(268)
  })
  it.each(['missing-uf', 'duplicate-uf', 'missing-value', 'wrong-denominator', 'partial-year', 'missing-provenance', 'changed-total'])('rejects %s instead of publishing partial or misleading data', (scenario) => {
    const edition = copy()
    const rows = edition.tables[0].records
    if (scenario === 'missing-uf') rows.pop()
    if (scenario === 'duplicate-uf') rows[2] = { ...rows[1] }
    if (scenario === 'missing-value') rows[1].victims = null as unknown as number
    if (scenario === 'wrong-denominator') rows[1].femalePopulation *= 2
    if (scenario === 'partial-year') edition.tables[1].year = 2026
    if (scenario === 'missing-provenance') edition.sha256 = ''
    if (scenario === 'changed-total') { rows[1].victims += 1; rows[1].rate = Math.round(rows[1].victims / rows[1].femalePopulation * 1e6) / 10 }
    expect(() => parseFeminicideEdition(edition)).toThrow(/RASEAM/)
  })
  it('keeps explicit zero distinct from missing and validates sums', () => {
    const edition = copy(), rows = edition.tables[0].records
    const amount = rows[1].victims
    rows[1].victims = 0; rows[1].rate = 0
    rows[2].victims += amount
    rows[2].rate = Math.round(rows[2].victims / rows[2].femalePopulation * 1e6) / 10
    expect(parseFeminicideEdition(edition).tables[0].records[1].victims).toBe(0)
  })
  it('integrates idempotently and keeps count and population rate rankings distinct', () => {
    const base = { indicators: [], sources: [], latest: [], rankings: [], series: [] } as unknown as DashboardData
    const data = integrateFeminicide(base, original)
    expect(integrateFeminicide(data, original)).toEqual(data)
    expect(data.latest).toHaveLength(54)
    expect(data.rankings.find((item) => item.indicatorId === FEMINICIDE_RATE_ID)?.items[0].geographyName).toBe('Acre')
    expect(data.rankings.find((item) => item.indicatorId === FEMINICIDE_COUNT_ID)?.items[0].geographyName).toBe('São Paulo')
    expect(data.indicators.find((item) => item.id === FEMINICIDE_COUNT_ID)?.direction).toBe('neutral')
    expect(data.sources[0].lastUpdated).toContain('20/02/2026')
    expect(data.series).toEqual([])
  })
})
