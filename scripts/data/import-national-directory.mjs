// Explicit maintenance command: review the diff before accepting directory changes.
import { readFile, writeFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'

const directoryUrl = 'https://unstats.un.org/home/nso_sites/'
async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) })
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`)
  return response.text()
}
const [html, countryJson] = await Promise.all([
  download(directoryUrl), download('https://api.worldbank.org/v2/country?format=json&per_page=400'),
])
const [, countries] = JSON.parse(countryJson)
const dashboard = JSON.parse(await readFile('public/data/mundialidade.json', 'utf8'))
const document = new JSDOM(html).window.document
const normalize = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
const directory = new Map()
for (const entry of document.querySelectorAll('li.leaf')) {
  const name = entry.querySelector('strong')?.textContent?.trim()
  const link = entry.querySelector('a[href]')
  if (!name || !link || !/^https?:\/\//.test(link.href)) continue
  directory.set(normalize(name), { institution: link.textContent.trim().replace(/\s+/g, ' '), url: link.href })
}
const english = new Intl.DisplayNames(['en'], { type: 'region' })
const overrides = {
  BRA: ['IBGE', 'https://www.ibge.gov.br/', 'https://servicodados.ibge.gov.br/api/docs/agregados', 'existing-connector'],
  MEX: ['INEGI', 'https://www.inegi.org.mx/', 'https://www.inegi.org.mx/servicios/api_indicadores.html', 'documented'],
  ITA: ['Istat', 'https://www.istat.it/', 'https://esploradati.istat.it/SDMXWS/swagger/index.html?urls.primaryName=v2', 'documented'],
  AUS: ['Australian Bureau of Statistics', 'https://www.abs.gov.au/', 'https://www.abs.gov.au/statistics/application-programming-interfaces-apis/data-api-user-guide', 'documented'],
  KEN: ['Kenya National Bureau of Statistics', 'https://www.knbs.or.ke/', 'https://www.knbs.or.ke/county-statistical-abstracts/', 'documented'],
  ZAF: ['Statistics South Africa', 'https://www.statssa.gov.za/', 'https://www.statssa.gov.za/?page_id=1417', 'documented'],
  IND: ['MoSPI', 'https://www.mospi.gov.in/', 'https://esankhyiki.mospi.gov.in/', 'documented'],
}
const entries = dashboard.countries.map((country) => {
  const wb = countries.find((item) => item.id === country.code)
  const names = wb ? [wb.name, english.of(wb.iso2Code)] : []
  const found = names.map((name) => directory.get(normalize(name))).find(Boolean)
  const override = overrides[country.code]
  return {
    countryCode: country.code,
    countryName: country.name,
    institution: override?.[0] ?? found?.institution ?? null,
    url: override?.[1] ?? found?.url ?? null,
    evidenceUrl: override?.[2] ?? directoryUrl,
    status: override?.[3] ?? (found ? 'directory-listed' : 'pending'),
    // Overrides were individually documented on this date; directory lookup is refreshed separately.
    checkedAt: override ? '2026-09-18' : new Date().toISOString().slice(0, 10),
  }
})
await writeFile('scripts/data/national-source-registry.json', JSON.stringify(entries, null, 2) + '\n')
console.log(JSON.stringify({ total: entries.length, identified: entries.filter((e) => e.url).length, pending: entries.filter((e) => !e.url).map((e) => e.countryName) }, null, 2))
