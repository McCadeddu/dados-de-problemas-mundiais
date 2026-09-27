import { readFile, writeFile } from 'node:fs/promises'
import type { DashboardData } from '../../src/types.js'
import { feminicideSeries, integrateFeminicide, parseFeminicideEdition } from './raseam-feminicide.js'

const dataPath = 'public/data/mundialidade.json'
const data = JSON.parse(await readFile(dataPath, 'utf8')) as DashboardData
const edition = parseFeminicideEdition(JSON.parse(await readFile('scripts/data/sources/raseam-2026-feminicide.json', 'utf8')))
const series = feminicideSeries(edition)
const updated = integrateFeminicide(data, edition)
for (const id of new Set(series.map((entry) => entry.indicatorId))) {
  await writeFile(`public/data/series/${id}.json`, JSON.stringify(series.filter((entry) => entry.indicatorId === id)))
}
await writeFile('public/data/brazil-feminicide.json', JSON.stringify({ ...edition, series }))
updated.generatedAt = new Date().toISOString()
await writeFile(dataPath, JSON.stringify(updated))
console.log('Feminicídio: 54 séries estaduais; edição revisada RASEAM 2026, referências 2024–2025. Sem consulta ao vivo.')
