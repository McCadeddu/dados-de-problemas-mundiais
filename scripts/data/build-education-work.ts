import { readFile, writeFile } from 'node:fs/promises'
import type { DashboardData, Indicator, Series, Source, Theme } from '../../src/types.js'
import { EDUCATION_WORK_INDICATORS, parseIbgeSeries, percentage, type IbgeRow } from './education-work.js'

const dataPath = 'public/data/mundialidade.json'
const data = JSON.parse(await readFile(dataPath, 'utf8')) as DashboardData
const validCountries = new Set(data.countries.map((country) => country.code))
async function json<T>(url: string): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) })
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`)
  return response.json() as Promise<T>
}
const results = await Promise.all(EDUCATION_WORK_INDICATORS.map(async (config) => {
  type Row = { country: { value: string }; countryiso3code: string; date: string; value: number | null }
  const [meta, rows] = await json<[{ pages: number; lastupdated: string }, Row[]]>(`https://api.worldbank.org/v2/country/all/indicator/${config.code}?format=json&per_page=20000`)
  if (!rows || meta.pages !== 1) throw new Error(`Resposta incompleta: ${config.code}`)
  const grouped = new Map<string, Series>()
  for (const row of rows) {
    if (!validCountries.has(row.countryiso3code) || !/^\d{4}$/.test(row.date)) continue
    const value = percentage(row.value, config.complement)
    if (value === null) continue
    const series = grouped.get(row.countryiso3code) ?? { indicatorId: config.id, geographyType: 'country', geographyCode: row.countryiso3code, geographyName: row.country.value, points: [] }
    series.points.push({ year: Number(row.date), value })
    grouped.set(row.countryiso3code, series)
  }
  const series = [...grouped.values()].map((entry) => ({ ...entry, points: entry.points.sort((a, b) => a.year - b.year) }))
  if (!series.length) throw new Error(`Sem dados: ${config.code}`)
  const indicator: Indicator = { id: config.id, name: config.name, themeId: config.themeId, description: config.description, unit: config.unit, geographyType: config.geographyType, sourceId: config.sourceId, direction: config.direction, latestYear: Math.max(...series.flatMap((entry) => entry.points.map((point) => point.year))) }
  const source: Source = {
    id: config.sourceId,
    name: config.sourceId === 'uis-literacy' ? 'UNESCO/UIS via Banco Mundial' : 'OIT/ILOSTAT via Banco Mundial',
    url: config.sourceId === 'uis-literacy' ? 'https://databrowser.uis.unesco.org/' : 'https://ilostat.ilo.org/data/',
    methodologyUrl: config.sourceId === 'uis-literacy' ? 'https://data.worldbank.org/indicator/SE.ADT.LITR.ZS' : 'https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS',
    license: 'CC BY 4.0 — World Bank Open Data; derivação explicitada no indicador', lastUpdated: meta.lastupdated,
  }
  return { indicator, series, source }
}))

const stateConfigs = [
  { id: 'ibge-state-illiteracy', themeId: 'illiteracy' as const, name: 'Analfabetismo — pessoas de 15 anos ou mais', table: '7113', variable: '10267', classification: '2[6794]|58[2795]', fourthQuarter: false, description: 'Taxa de analfabetismo das pessoas de 15 anos ou mais, ambos os sexos. PNAD Contínua anual/IBGE, tabela 7113. Anos sem divulgação não são interpolados.' },
  { id: 'ibge-state-no-pension', themeId: 'decent-work' as const, name: 'Ocupados sem contribuição previdenciária — 4º trimestre', table: '5947', variable: '4108', classification: '12027[99158]', fourthQuarter: true, description: 'Percentual das pessoas ocupadas de 14 anos ou mais que não contribuem para instituto de previdência em nenhum trabalho. PNAD Contínua/IBGE, tabela 5947; usa exclusivamente o 4º trimestre de cada ano, não uma média anual. Não equivale à taxa de informalidade ou à ausência de toda proteção social.' },
]
const states = await Promise.all(stateConfigs.map(async (config) => {
  const url = `https://servicodados.ibge.gov.br/api/v3/agregados/${config.table}/periodos/all/variaveis/${config.variable}?localidades=N3[all]&classificacao=${encodeURIComponent(config.classification)}`
  const raw = await json<Array<{ resultados: Array<{ series: IbgeRow[] }> }>>(url)
  if (raw.length !== 1 || raw[0].resultados.length !== 1) throw new Error(`Recorte IBGE inesperado: ${config.table}`)
  const series = parseIbgeSeries(raw[0].resultados[0].series, config.id, config.fourthQuarter)
  if (series.length !== 27) throw new Error(`Cobertura incompleta de UFs: ${config.table}`)
  const indicator: Indicator = { id: config.id, name: config.name, themeId: config.themeId, description: config.description, unit: '%', geographyType: 'brazil-state', sourceId: `ibge-${config.table}`, direction: 'higher-worse', latestYear: Math.max(...series.flatMap((entry) => entry.points.map((point) => point.year))) }
  const source: Source = { id: indicator.sourceId, name: `IBGE PNAD Contínua — tabela ${config.table}`, url: `https://sidra.ibge.gov.br/tabela/${config.table}`, methodologyUrl: `https://servicodados.ibge.gov.br/api/v3/agregados/${config.table}/metadados`, license: 'Dados públicos do IBGE; citar a fonte', lastUpdated: `Referência até ${indicator.latestYear}${config.fourthQuarter ? ' (4º trimestre)' : ''}` }
  return { indicator, series, source }
}))

const themes: Theme[] = [
  { id: 'illiteracy', name: 'Analfabetismo', description: 'Dificuldades de leitura e escrita entre adultos e jovens.' },
  { id: 'decent-work', name: 'Trabalho e proteção social', description: 'Desemprego, informalidade, falta de contribuição previdenciária e trabalho escravo ou forçado.' },
]
const all = [...results, ...states]
const ids = new Set(all.map((entry) => entry.indicator.id))
data.themes = [...data.themes.filter((theme) => !themes.some((item) => item.id === theme.id)), ...themes]
data.indicators = [...data.indicators.filter((indicator) => !ids.has(indicator.id)), ...all.map((entry) => entry.indicator)]
const sources = new Map(data.sources.map((source) => [source.id, source]))
for (const entry of all) sources.set(entry.source.id, entry.source)
data.sources = [...sources.values()]
data.latest = data.latest.filter((entry) => !ids.has(entry.indicatorId))
data.rankings = data.rankings.filter((entry) => !ids.has(entry.indicatorId))
for (const entry of all) {
  const latest = entry.series.map((series) => {
    const point = series.points.at(-1)!
    return { indicatorId: series.indicatorId, geographyType: series.geographyType, geographyCode: series.geographyCode, geographyName: series.geographyName, ...point }
  })
  data.latest.push(...latest)
  data.rankings.push({ indicatorId: entry.indicator.id, geographyType: entry.indicator.geographyType, year: entry.indicator.latestYear, items: [...latest].sort((a, b) => b.value - a.value) })
  await writeFile(`public/data/series/${entry.indicator.id}.json`, JSON.stringify(entry.series))
  console.log(`${entry.indicator.id}: ${entry.series.length} territórios; até ${entry.indicator.latestYear}`)
}
data.generatedAt = new Date().toISOString()
await writeFile(dataPath, JSON.stringify(data))
