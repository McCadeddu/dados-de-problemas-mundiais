import { afterEach, expect, it, vi } from 'vitest'
import Papa from 'papaparse'
import { INCOME_DISTRIBUTION } from '../../src/lib/incomeDistribution.js'
import { collectIncomeDistribution, incomeDistributionCsv, parseIncomeDistribution, type IncomeRow } from './income-distribution.js'

const countries = [{ code: 'BRA', name: 'Brasil' }]
const envelope = <T>(rows: T[]) => [{ page: 1, pages: 1, total: rows.length, lastupdated: '2026-07-13' }, rows] as [{ page: number; pages: number; total: number; lastupdated: string }, T[]]
function inputs() {
  return INCOME_DISTRIBUTION.map(d => ({ code: d.code,
    raw: envelope<IncomeRow>(Array.from({ length: 26 }, (_, i) => ({ indicator: { id: d.code }, countryiso3code: 'BRA', country: { value: 'Brazil' }, date: String(2000 + i), value: i === 25 ? null : i === 0 ? 0 : 20, obs_status: i === 0 ? 'F' : '', footnote: '' }))),
    metadata: envelope([{ id: d.code, name: d.sourceName, source: { id: '2' }, sourceNote: 'Percentage share of income or consumption.', sourceOrganization: 'World Bank/PIP' }]),
  }))
}
const parse = () => parseIncomeDistribution(inputs(), countries, '2026-10-02')
afterEach(() => vi.restoreAllMocks())

it('retains the WDI survey declaration in values and exports without inferring an empty note', () => {
  const raw = inputs()
  raw[0].raw[1][0].footnote = 'Based on data from PNADC-E1. Estimated from unit-record income data.'
  const data = parseIncomeDistribution(raw, countries, '2026-10-02')
  expect(data.series[0].points[0].sourceIncomeMetadata?.surveyAcronym).toBe('PNADC-E1')
  expect(data.series[1].points[0].sourceIncomeMetadata).toBeUndefined()
  const csv = Papa.parse<Record<string, string>>(incomeDistributionCsv(data), { header: true, skipEmptyLines: true }).data
  expect(csv[0].pesquisa_wdi).toBe('PNADC-E1')
  expect(csv[0].conceito_wdi).toBe('income')
  expect(csv[0].nota_wdi).toBe(raw[0].raw[1][0].footnote)
})

it('preserves published zero, null, year and raw status; excludes aggregate groups', () => {
  const raw = inputs()
  raw[0].raw[1].push({ ...raw[0].raw[1][0], countryiso3code: 'WLD' }); raw[0].raw[0].total++
  const data = parseIncomeDistribution(raw, countries, '2026-10-02')
  expect(data.series).toHaveLength(2)
  expect(data.series[0].points[0]).toEqual({ year: 2000, value: 0, status: 'F', sourceFootnote: '' })
  expect(data.series[0].points.at(-1)?.value).toBeNull()
})
it('rejects truncated pagination, duplicates, missing periods and future/invalid observations', () => {
  const paged = inputs(); paged[0].raw[0].pages = 2
  expect(() => parseIncomeDistribution(paged, countries, '2026-10-02')).toThrow(/incompleta/)
  const duplicate = inputs(); duplicate[0].raw[1].push(duplicate[0].raw[1][0]); duplicate[0].raw[0].total++
  expect(() => parseIncomeDistribution(duplicate, countries, '2026-10-02')).toThrow(/duplicado/)
  const omitted = inputs(); omitted[0].raw[1].splice(4, 1); omitted[0].raw[0].total--
  expect(() => parseIncomeDistribution(omitted, countries, '2026-10-02')).toThrow(/omitido/)
  for (const value of [NaN, -1, 101]) {
    const invalid = inputs(); invalid[0].raw[1][0].value = value
    expect(() => parseIncomeDistribution(invalid, countries, '2026-10-02')).toThrow(/inválida/)
  }
  const future = inputs(); future[0].raw[1][0].date = '2027'
  expect(() => parseIncomeDistribution(future, countries, '2026-10-02')).toThrow(/inválida/)
})
it('rejects changed definitions, inconsistent editions and missing country coverage', () => {
  const definition = inputs(); definition[0].metadata[1][0].name = 'Wealth share'
  expect(() => parseIncomeDistribution(definition, countries, '2026-10-02')).toThrow(/definição/)
  const editions = inputs(); editions[1].raw[0].lastupdated = '2026-07-14'
  expect(() => parseIncomeDistribution(editions, countries, '2026-10-02')).toThrow(/edições/)
  expect(() => parseIncomeDistribution(inputs(), [...countries, { code: 'ARG', name: 'Argentina' }], '2026-10-02')).toThrow(/cobertura/)
})
it('keeps a previous valid collection on transport failure and fails without a cache', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const fetcher = vi.fn().mockRejectedValue(new Error('offline'))
  const previous = parse()
  const next = await collectIncomeDistribution(countries, previous, fetcher)
  expect(next.cached).toBe(true)
  expect(next.series).toEqual(previous.series)
  expect(next.fetchedAt).toBe(previous.fetchedAt)
  await expect(collectIncomeDistribution(countries, undefined, fetcher)).rejects.toThrow()
})
it('preserves existing observations if a new collection silently loses coverage', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const reduced = inputs(); reduced[0].raw[1][24].value = null
  const fetcher = vi.fn(async (url: string | URL | Request) => {
    const input = reduced.find(i => String(url).includes(i.code))!
    return new Response(JSON.stringify(String(url).includes('/country/all/') ? input.raw : input.metadata), { status: 200 })
  })
  const next = await collectIncomeDistribution(countries, parse(), fetcher)
  expect(next.cached).toBe(true)
  expect(next.series[0].points[24].value).toBe(20)
})
it('exports zero distinctly from missing observations and preserves provenance', () => {
  const csv = Papa.parse<Record<string, string>>(incomeDistributionCsv(parse()), { header: true, skipEmptyLines: true }).data
  expect(csv[0].valor).toBe('0')
  expect(csv[25].valor).toBe('')
  expect(csv[0].sinalizacao).toBe('F')
  expect(csv[0].codigo_fonte).toBe('SI.DST.10TH.10')
  expect(csv[0].metodologia).toContain('SI.DST.10TH.10')
  expect(csv[0].unidade).toBe('% da renda ou consumo')
})
