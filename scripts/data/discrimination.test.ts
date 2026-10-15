import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { normalizeDiscrimination, SDG_TOTAL_DIMENSIONS, validateSdgPage, type SdgObservation } from './discrimination.js'
import type { DashboardData } from '../../src/types.js'
import { DISCRIMINATION_ID } from '../../src/lib/discrimination.js'

const countries = [{ code: 'BRA', name: 'Brasil', continent: 'South America' }]
const mapping = new Map([[76, 'BRA']])
function row(overrides: Partial<SdgObservation> = {}): SdgObservation {
  return { indicator: ['16.b.1'], series: 'VC_VOV_GDSD', geoAreaCode: '76', geoAreaName: 'Brazil', timePeriodStart: 2023,
    value: '0.00', valueType: 'Float', source: 'Pesquisa nacional', footnotes: ['Time period: refers only to occurrences in the last 12 months. Age: 18 years and over.'],
    attributes: { Nature: 'C', Units: 'PERCENT', 'Observation Status': 'A' }, dimensions: { ...SDG_TOTAL_DIMENSIONS }, ...overrides }
}
describe('discrimination ingestion', () => {
  it('keeps a valid zero and the original survey notes', () => {
    const result = normalizeDiscrimination([row()], mapping, countries)
    expect(result.series[0].points[0]).toMatchObject({ year: 2023, value: 0 })
    expect(result.series[0].points[0].sourceFootnote).toContain('Age: 18 years and over')
  })
  it('excludes absent or different recall windows, estimates, subgroups and the duplicate SDG attachment', () => {
    const rows = [row({ indicator: ['10.3.1'] }), row({ footnotes: [''] }), row({ footnotes: ['last 5 years'] }),
      row({ footnotes: ['last 3 months'] }), row({ footnotes: ['last 12 months and last 5 years'] }),
      row({ attributes: { ...row().attributes, Nature: 'E' } }), row({ dimensions: { ...SDG_TOTAL_DIMENSIONS, Sex: 'FEMALE' } }),
      row({ geoAreaCode: '1' }), row({ value: '..' }), row({ value: '101' })]
    expect(normalizeDiscrimination(rows, mapping, countries).series).toEqual([])
  })
  it('rejects ambiguous country-years and newly introduced dimensions', () => {
    expect(() => normalizeDiscrimination([row(), row({ value: '20' })], mapping, countries)).toThrow('ambíguas')
    expect(() => normalizeDiscrimination([row({ dimensions: { ...SDG_TOTAL_DIMENSIONS, NewCategory: '_T' } })], mapping, countries)).toThrow('Nova dimensão')
  })
  it('rejects partial pagination and changed totals', () => {
    const page = { size: 100, totalElements: 101, totalPages: 2, pageNumber: 2, data: [row()] }
    expect(() => validateSdgPage(page, 2, 101)).not.toThrow()
    expect(() => validateSdgPage({ ...page, data: [] }, 2, 101)).toThrow('Paginação')
    expect(() => validateSdgPage(page, 2, 102)).toThrow('Paginação')
    expect(() => validateSdgPage(page, 1, 101)).toThrow('Paginação')
  })
  it('reproduces published observations from the original source and preserves the no-ranking/no-average rules', () => {
    const data = JSON.parse(readFileSync('public/data/mundialidade.json', 'utf8')) as DashboardData
    const source = readFileSync('public/data/un-discrimination-source.json')
    const audit = JSON.parse(readFileSync('public/data/un-discrimination-audit.json', 'utf8'))
    expect(createHash('sha256').update(source).digest('hex')).toBe(audit.sourceSha256)
    const m49 = JSON.parse(readFileSync('scripts/data/sources/un-m49-2026-10-15.json', 'utf8')) as { countries: Array<{ m49: string; iso3: string }> }
    const normalized = normalizeDiscrimination(JSON.parse(source.toString('utf8')).data, new Map(m49.countries.map(c => [Number(c.m49), c.iso3])), data.countries)
    expect(normalized.series).toEqual(JSON.parse(readFileSync(`public/data/series/${DISCRIMINATION_ID}.json`, 'utf8')))
    expect(normalized.selected.length).toBe(audit.observations)
    expect(normalized.series.length).toBe(audit.countries)
    expect(normalized.reasons).toEqual(audit.exclusions)
    expect(data.rankings.some(r => r.indicatorId === DISCRIMINATION_ID)).toBe(false)
  })
})
