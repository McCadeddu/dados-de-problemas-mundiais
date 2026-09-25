import { readFile, writeFile } from 'node:fs/promises'
import type { DashboardData, NationalData, NationalSource } from '../../src/types.js'
import { parsePoverty, POVERTY_URL, type JsonStat } from './eurostat.js'
import { collectAbsUnemployment } from './abs.js'
import { collectIneUnemployment } from './ine-portugal.js'
import { collectIstatUnemployment } from './istat.js'
import { collectInegiUnemployment } from './inegi.js'
import { collectStatsSaUnemployment } from './statssa.js'
import { collectMospiUnemployment } from './mospi.js'

const outputPath = 'public/data/national-data.json'
const registry = JSON.parse(await readFile('scripts/data/national-source-registry.json', 'utf8')) as NationalSource[]
const dashboard = JSON.parse(await readFile('public/data/mundialidade.json', 'utf8')) as DashboardData
if (new Set(registry.map((entry) => entry.countryCode)).size !== registry.length
  || dashboard.countries.some((country) => !registry.some((entry) => entry.countryCode === country.code))) {
  throw new Error('Catálogo nacional incompleto ou duplicado; revisar países antes da publicação')
}
let poverty: NationalData['poverty']
try {
  const response = await fetch(POVERTY_URL, { signal: AbortSignal.timeout(60000) })
  if (!response.ok) throw new Error(`Eurostat HTTP ${response.status}`)
  const raw = await response.json() as JsonStat
  const series = parsePoverty(raw)
  if (series.length < 27) throw new Error('Cobertura Eurostat abaixo do mínimo esperado')
  poverty = {
    fetchedAt: new Date().toISOString(), sourceUpdatedAt: raw.updated, cached: false,
    sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/view/ilc_li02/default/table?lang=en',
    methodologyUrl: 'https://ec.europa.eu/eurostat/cache/metadata/en/ilc_sieusilc.htm',
    licenseUrl: 'https://ec.europa.eu/eurostat/help/copyright-notice',
    requestUrl: POVERTY_URL, series,
  }
} catch (error) {
  const previous = JSON.parse(await readFile(outputPath, 'utf8')) as NationalData
  if (!previous.poverty?.series?.length) throw error
  poverty = { ...previous.poverty, cached: true }
  console.warn(`Eurostat indisponível; mantendo coleta de ${poverty.fetchedAt}: ${String(error)}`)
}
const previous = JSON.parse(await readFile(outputPath, 'utf8')) as NationalData
const australiaUnemployment = await collectAbsUnemployment(previous.australiaUnemployment)
const portugalUnemployment = await collectIneUnemployment(previous.portugalUnemployment)
const italyUnemployment = await collectIstatUnemployment(previous.italyUnemployment)
const mexicoUnemployment = await collectInegiUnemployment(previous.mexicoUnemployment)
const southAfricaUnemployment = await collectStatsSaUnemployment(previous.southAfricaUnemployment)
const indiaUnemployment = await collectMospiUnemployment(previous.indiaUnemployment)
const result: NationalData = { generatedAt: new Date().toISOString(), registry, poverty, australiaUnemployment, portugalUnemployment, italyUnemployment, mexicoUnemployment, southAfricaUnemployment, indiaUnemployment }
// Match the other static artifacts: Vite can hold the destination open on Windows,
// preventing replacement by rename. Publication happens only after the build passes.
await writeFile(outputPath, JSON.stringify(result))

const globalIndicators = dashboard.indicators.filter((indicator) => indicator.geographyType === 'country')
const coverage = dashboard.countries.map((country) => ({
  countryCode: country.code, countryName: country.name,
  sourceStatus: registry.find((entry) => entry.countryCode === country.code)?.status,
  supplementalIndicators: [
    ...(country.code === 'IND' && indiaUnemployment.points.length ? ['mospi-monthly-unemployment'] : []),
    ...(poverty.series.some((series) => series.countryCode === country.code) ? ['eurostat-relative-poverty'] : []),
    ...(country.code === 'ZAF' && southAfricaUnemployment.points.length ? ['statssa-quarterly-unemployment'] : []),
    ...(country.code === 'AUS' ? ['abs-monthly-unemployment'] : []),
    ...(country.code === 'PRT' ? ['ine-quarterly-unemployment'] : []),
    ...(country.code === 'MEX' && mexicoUnemployment.points.length ? ['inegi-monthly-unemployment'] : []),
    ...(country.code === 'ITA' ? ['istat-monthly-unemployment'] : []),
  ],
  indicators: globalIndicators.map((indicator) => {
    const observation = dashboard.latest.find((value) => value.indicatorId === indicator.id && value.geographyCode === country.code)
    return { indicatorId: indicator.id, themeId: indicator.themeId, year: observation?.year ?? null, hasData: Boolean(observation) }
  }),
}))
await writeFile('public/data/country-coverage.json', JSON.stringify({ generatedAt: result.generatedAt, countries: coverage }))
console.log(`Catálogo: ${registry.length} territórios; ${registry.filter((entry) => entry.url).length} fontes identificadas; pobreza relativa: ${poverty.series.length} países.`)
console.log(`ABS: ${australiaUnemployment.points.length} meses; último período: ${australiaUnemployment.points.at(-1)?.period}; coleta anterior: ${australiaUnemployment.cached}.`)
console.log(`INE Portugal: ${portugalUnemployment.points.length} trimestres; último período: ${portugalUnemployment.points.at(-1)?.period}; coleta anterior: ${portugalUnemployment.cached}.`)
console.log(`Istat: ${italyUnemployment.points.length} meses; último período: ${italyUnemployment.points.at(-1)?.period}; edição: ${italyUnemployment.edition}; coleta anterior: ${italyUnemployment.cached}.`)

console.log(`INEGI: ${mexicoUnemployment.points.length} meses; último período: ${mexicoUnemployment.points.at(-1)?.period}; coleta anterior: ${mexicoUnemployment.cached}.`)

console.log(`Stats SA: ${southAfricaUnemployment.points.length} trimestres; edição: ${southAfricaUnemployment.edition}; coleta anterior: ${southAfricaUnemployment.cached}.`)
console.log(`MoSPI: ${indiaUnemployment.points.length} meses; último período: ${indiaUnemployment.points.at(-1)?.period}; coleta anterior: ${indiaUnemployment.cached}.`)
