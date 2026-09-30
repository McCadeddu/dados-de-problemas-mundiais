import { readFile, writeFile } from 'node:fs/promises'
import type { DashboardData, Series } from '../../src/types.js'
import { fetchJsonWithRetry } from './http.js'
import { POVERTY_ID, POVERTY_NAME, POVERTY_DESCRIPTION, POVERTY_METADATA_URL, validatePovertyDefinition } from './poverty-definition.js'

// Only relabel an existing snapshot after checking every saved observation.
const requestUrl = 'https://api.worldbank.org/v2/country/all/indicator/SI.POV.UMIC?source=2&format=json&per_page=20000'
const metadata = validatePovertyDefinition(await fetchJsonWithRetry(POVERTY_METADATA_URL))
const raw = await fetchJsonWithRetry<[{ pages: number; total: number; lastupdated: string }, Array<{ countryiso3code: string; date: string; value: number | null }> ]>(requestUrl)
if (raw[0].pages !== 1 || raw[0].total !== raw[1].length) throw new Error('Resposta de pobreza incompleta')
const series: Series[] = JSON.parse(await readFile(`public/data/series/${POVERTY_ID}.json`, 'utf8'))
const apiValues = new Map(raw[1].map(r => [`${r.countryiso3code}/${r.date}`, r.value]))
let checked = 0
for (const s of series) for (const p of s.points) {
  if (apiValues.get(`${s.geographyCode}/${p.year}`) !== p.value) throw new Error(`Série diverge da edição atual em ${s.geographyCode}/${p.year}; atualizar valores antes de alterar o rótulo`)
  checked++
}
if (!checked) throw new Error('Série de pobreza vazia')
const path = 'public/data/mundialidade.json'
const data: DashboardData = JSON.parse(await readFile(path, 'utf8'))
const indicator = data.indicators.find(i => i.id === POVERTY_ID)
if (!indicator) throw new Error('Indicador de pobreza ausente')
indicator.name = POVERTY_NAME
indicator.description = POVERTY_DESCRIPTION
// Do not alter generatedAt: this is a metadata verification, not a full refresh.
await writeFile(path, JSON.stringify(data))
await writeFile('public/data/poverty-definition-review.json', JSON.stringify({ checkedAt: new Date().toISOString(), checkedObservations: checked, sourceUpdatedAt: raw[0].lastupdated, requestUrl, metadataUrl: POVERTY_METADATA_URL, metadata, result: 'Every saved observation matches the current 2021 PPP series; label corrected. Not a full data refresh.' }, null, 2))
console.log(`Pobreza: ${checked} observações conferidas; metadados corrigidos para US$ 8,30, PPC 2021.`)
