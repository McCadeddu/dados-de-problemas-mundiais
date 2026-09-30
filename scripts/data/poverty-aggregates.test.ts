import { expect, it, vi } from 'vitest'
import { POVERTY_REGIONS } from '../../src/lib/povertyAggregates.js'
import { collectPovertyAggregates, parsePovertyAggregates, povertyAggregatesCsv, type GeographyRow, type PovertyRow } from './poverty-aggregates.js'
const envelope = <T>(rows: T[]) => [{ page: 1, pages: 1, total: rows.length, lastupdated: '2026-07-13' }, rows] as [{ page: number; pages: number; total: number; lastupdated: string }, T[]]
const metadata = envelope([{ id: 'SI.POV.UMIC', source: { id: '2' }, name: 'Poverty at $8.30 a day (2021 PPP) (% of population)', sourceNote: '2021 international prices', sourceOrganization: 'World Bank/PIP' }])
const codes = ['WLD', ...POVERTY_REGIONS, 'BRA']
const geographies = envelope<GeographyRow>(codes.map(id => ({ id, name: id, region: { id: id === 'BRA' ? 'LCN' : 'NA', value: id === 'BRA' ? 'Latin America' : 'Aggregates' } })))
function rows() {
  return envelope<PovertyRow>(codes.flatMap(code => Array.from({ length: 26 }, (_, i) => ({ indicator: { id: 'SI.POV.UMIC' }, countryiso3code: code, date: String(2000 + i), value: i === 25 ? null : code === 'BRA' ? 0 : 20, obs_status: '' }))))
}
const parse = () => parsePovertyAggregates(rows(), geographies, metadata, '2026-09-30')
it('keeps countries, regions and world distinct, with zeros and missing values intact', () => {
  const data = parse()
  expect(data.areas.filter(a => a.kind === 'region')).toHaveLength(7)
  expect(data.areas.find(a => a.code === 'BRA')?.kind).toBe('country')
  expect(data.series.find(s => s.areaCode === 'BRA')?.points.at(-2)?.value).toBe(0)
  expect(data.series.find(s => s.areaCode === 'BRA')?.points.at(-1)?.value).toBeNull()
})
it('rejects pagination, duplicated observations, incomplete periods and invalid percentages', () => {
  const paged = rows(); paged[0].pages = 2
  expect(() => parsePovertyAggregates(paged, geographies, metadata, '2026-09-30')).toThrow(/incompleta/)
  const duplicate = rows(); duplicate[1].push(duplicate[1][0]); duplicate[0].total++
  expect(() => parsePovertyAggregates(duplicate, geographies, metadata, '2026-09-30')).toThrow(/duplicada/)
  const missing = rows(); missing[1].splice(5, 1); missing[0].total--
  expect(() => parsePovertyAggregates(missing, geographies, metadata, '2026-09-30')).toThrow(/incompleta/)
  const invalid = rows(); invalid[1][0].value = 101
  expect(() => parsePovertyAggregates(invalid, geographies, metadata, '2026-09-30')).toThrow(/inválida/)
})
it('blocks a changed poverty definition', () => {
  const changed = structuredClone(metadata); changed[1][0].name = '$6.85 (2017 PPP)'
  expect(() => parsePovertyAggregates(rows(), geographies, changed, '2026-09-30')).toThrow(/Definição/)
})
it('preserves a validated previous collection on failure and fails without one', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const fetcher = vi.fn().mockRejectedValue(new Error('offline'))
  const prior = parse()
  const cached = await collectPovertyAggregates(prior, fetcher)
  expect(cached.cached).toBe(true)
  expect(cached.series).toEqual(prior.series)
  expect(cached.fetchedAt).toBe(prior.fetchedAt)
  await expect(collectPovertyAggregates(undefined, fetcher)).rejects.toThrow()
  vi.restoreAllMocks()
})
it('exports scale, year, poverty line, PPP, missing values and provenance', () => {
  const csv = povertyAggregatesCsv(parse())
  expect(csv).toContain('"linha_dolar_dia","ano_ppc"')
  expect(csv).toContain('"8.3","2021","BRA","BRA","country","2025","","% da população"')
  expect(csv).toContain('"8.3","2021","WLD","WLD","world","2024","20"')
})
it('does not overwrite previous observations when an otherwise valid response loses coverage', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const reduced = rows(); reduced[1].find(r => r.countryiso3code === 'BRA' && r.date === '2024')!.value = null
  const fetcher = vi.fn(async (url: string | URL | Request) => new Response(JSON.stringify(String(url).includes('/country/all/') ? reduced : String(url).includes('/country?') ? geographies : metadata), { status: 200 }))
  const prior = parse()
  const next = await collectPovertyAggregates(prior, fetcher)
  expect(next.cached).toBe(true)
  expect(next.series.find(s => s.areaCode === 'BRA')?.points.find(p => p.year === 2024)?.value).toBe(0)
  vi.restoreAllMocks()
})
