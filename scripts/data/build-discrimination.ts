import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fetchJsonWithRetry } from './http.js'
import { SDG_API, normalizeDiscrimination, integrateDiscrimination, validateSdgPage, type SdgPage } from './discrimination.js'
import { DISCRIMINATION_ID, DISCRIMINATION_METADATA } from '../../src/lib/discrimination.js'
import type { DashboardData } from '../../src/types.js'

const base = 'public/data/'
const dashboard = JSON.parse(await readFile(base + 'mundialidade.json', 'utf8')) as DashboardData
const mapping = JSON.parse(await readFile('scripts/data/sources/un-m49-2026-10-15.json', 'utf8')) as { sourceUrl: string; reviewedAt: string; countries: Array<{ m49: string; iso3: string }> }
type IndicatorMetadata = Array<{ code: string; series: Array<{ code: string; release: string; description: string }> }>
const metadataUrl = `${SDG_API}/Indicator/16.b.1/Series/List`
const getMetadata = () => fetchJsonWithRetry<IndicatorMetadata>(metadataUrl)
const metadata = await getMetadata()
const definition = metadata.find(i => i.code === '16.b.1')?.series.find(s => s.code === 'VC_VOV_GDSD')
if (!definition?.release) throw new Error('Série ou edição ONU não identificada')
const lastAttemptAt = new Date().toISOString()
// Several simultaneous dimension filters time out on this API. Filter grounds remotely and validate every dimension locally.
const params = new URLSearchParams({ seriesCode: 'VC_VOV_GDSD', releaseCode: definition.release, pageSize: '100',
  dimensions: JSON.stringify([{ name: 'Grounds of discrimination', values: ['ALL'] }]) })
const requestBase = `${SDG_API}/Series/Data?${params}`
const first = await fetchJsonWithRetry<SdgPage>(`${requestBase}&page=1`)
validateSdgPage(first, 1)
const pages: SdgPage[] = [first]
let next = 2
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next <= first.totalPages) {
    const page = next++
    const response = await fetchJsonWithRetry<SdgPage>(`${requestBase}&page=${page}`)
    validateSdgPage(response, page, first.totalElements); pages[page - 1] = response
  }
}))
if ((await getMetadata()).find(i => i.code === '16.b.1')?.series.find(s => s.code === definition.code)?.release !== definition.release) throw new Error('A edição ONU mudou durante a coleta')
const rows = pages.flatMap(p => p.data)
if (new Set(rows.map(r => JSON.stringify(r))).size !== rows.length) throw new Error('Páginas ONU contêm observações repetidas')
const normalized = normalizeDiscrimination(rows, new Map(mapping.countries.map(c => [Number(c.m49), c.iso3])), dashboard.countries)
const updated = integrateDiscrimination(dashboard, normalized.series, definition.release)
const fetchedAt = new Date().toISOString()
updated.generatedAt = fetchedAt
const raw = JSON.stringify({ release: definition.release, metadata, dimensions: (first as SdgPage & { dimensions: unknown }).dimensions,
  attributes: (first as SdgPage & { attributes: unknown }).attributes,
  data: rows })
const audit = { fetchedAt, lastAttemptAt, cached: false, release: definition.release, metadataUrl, methodologyUrl: DISCRIMINATION_METADATA,
  requestBase, pages: first.totalPages, rawRecords: rows.length, countries: normalized.series.length, observations: normalized.selected.length,
  exclusions: normalized.reasons, mappingSourceUrl: mapping.sourceUrl, mappingReviewedAt: mapping.reviewedAt,
  sourceFile: 'un-discrimination-source.json', sourceSha256: createHash('sha256').update(raw).digest('hex') }
await writeFile(base + audit.sourceFile, raw)
await writeFile(base + 'un-discrimination-audit.json', JSON.stringify(audit))
await writeFile(`${base}series/${DISCRIMINATION_ID}.json`, JSON.stringify(normalized.series))
await writeFile(base + 'mundialidade.json', JSON.stringify(updated))
try {
  const coverage = JSON.parse(await readFile(base + 'country-coverage.json', 'utf8')) as { catalogGeneratedAt?: string; countries: Array<{ countryCode: string; indicators: Array<{ indicatorId: string; themeId: string; year: number | null; hasData: boolean }> }> }
  for (const country of coverage.countries) {
    const latest = updated.latest.find(v => v.indicatorId === DISCRIMINATION_ID && v.geographyCode === country.countryCode)
    country.indicators = [...country.indicators.filter(i => i.indicatorId !== DISCRIMINATION_ID), { indicatorId: DISCRIMINATION_ID, themeId: 'gender-equality', year: latest?.year ?? null, hasData: !!latest }]
  }
  coverage.catalogGeneratedAt = updated.generatedAt
  await writeFile(base + 'country-coverage.json', JSON.stringify(coverage))
} catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
console.log(`Discriminação: ${audit.observations} observações elegíveis; ${audit.countries} países/territórios; edição ${audit.release}.`)
