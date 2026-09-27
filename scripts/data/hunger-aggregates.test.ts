import { describe, expect, it, vi } from 'vitest'
import Papa from 'papaparse'
import { HUNGER_AGGREGATE_INDICATORS as indicators, HUNGER_AREAS } from '../../src/lib/hungerAggregates.js'
import { parseHungerAggregates, collectHungerAggregates, hungerAggregatesCsv, type AggregateRow, type AreaRow, type MetadataRow } from './hunger-aggregates.js'

function envelope<T>(data: T[]): [{ page: number; pages: number; total: number; lastupdated: string }, T[]] {
  return [{ page: 1, pages: 1, total: data.length, lastupdated: '2026-07-13' }, data]
}
function fixture() {
  const data = envelope<AggregateRow>(indicators.flatMap(i => HUNGER_AREAS.flatMap(area => Array.from({ length: 26 }, (_, index) => ({ indicator: { id: i.code }, countryiso3code: area, date: String(2000 + index), value: index === 25 ? null : 25, obs_status: '' })))))
  const areas = envelope<AreaRow>(HUNGER_AREAS.map(id => ({ id, name: id, region: { id: 'NA', value: 'Aggregates' } })))
  const metadata = indicators.map(i => envelope<MetadataRow>([{ id: i.code, name: `${i.name} (%)`, source: { id: '2' }, sourceNote: 'Definição oficial', sourceOrganization: 'Fonte oficial' }]))
  return { data, areas, metadata }
}
const now = '2026-09-27T00:00:00Z'

describe('official hunger and water aggregates', () => {
  it('keeps published aggregate values, zeros, nulls and flags without calculating countries', () => {
    const f = fixture(); f.data[1][0].value = 0; f.data[1][0].obs_status = 'p'
    const result = parseHungerAggregates(f.data, f.areas, f.metadata, now)
    expect(result.series).toHaveLength(32)
    expect(result.series[0].points[0]).toEqual({ year: 2000, value: 0, status: 'p' })
    expect(result.series[0].points.at(-1)?.value).toBeNull()
    const csv = Papa.parse<Record<string, string>>(hungerAggregatesCsv(result), { header: true, skipEmptyLines: true })
    expect(csv.errors).toEqual([])
    expect(csv.data[0]).toMatchObject({ valor: '0', sinalizacao: 'p', ano_fonte: '2000', codigo_fonte: 'SN.ITK.DEFC.ZS' })
    expect(csv.data[25].valor).toBe('')
    expect(csv.data[0].consulta).toContain('source=2')
  })
  it('rejects pagination, invalid percentages, duplicates and missing periods', () => {
    for (const mutation of [
      (f: ReturnType<typeof fixture>) => { f.data[0].pages = 2 },
      (f: ReturnType<typeof fixture>) => { f.data[1][0].value = 101 },
      (f: ReturnType<typeof fixture>) => { f.data[1][0].value = NaN },
      (f: ReturnType<typeof fixture>) => { f.data[1][0].countryiso3code = 'BRA' },
      (f: ReturnType<typeof fixture>) => { f.data[1][0] = f.data[1][1] },
      (f: ReturnType<typeof fixture>) => { f.data[1].splice(3, 1); f.data[0].total-- },
      (f: ReturnType<typeof fixture>) => { f.areas[1][0].region.id = 'LCN' },
      (f: ReturnType<typeof fixture>) => { f.metadata[0][1][0].source.id = 'other' },
    ]) { const f = fixture(); mutation(f); expect(() => parseHungerAggregates(f.data, f.areas, f.metadata, now)).toThrow() }
  })
  it('retains a previous snapshot on schema failure but fails a first collection', async () => {
    const f = fixture(); const previous = parseHungerAggregates(f.data, f.areas, f.metadata, now)
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetcher = vi.fn().mockImplementation(async () => new Response('[]'))
    expect(await collectHungerAggregates(previous, fetcher)).toMatchObject({ cached: true, fetchedAt: previous.fetchedAt, series: previous.series })
    await expect(collectHungerAggregates(undefined, fetcher)).rejects.toThrow()
    warning.mockRestore()
  })
})
