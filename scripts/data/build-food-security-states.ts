import { readFile, writeFile } from 'node:fs/promises'
import type { DashboardData } from '../../src/types.js'
import { collectStateFoodSecurity, integrateStateFoodSecurity, type StateFoodCollection } from './ibge-food-security-states.js'

const dataPath = 'public/data/mundialidade.json'
const snapshotPath = 'public/data/brazil-food-security-states.json'
const data = JSON.parse(await readFile(dataPath, 'utf8')) as DashboardData
const previous = await readFile(snapshotPath, 'utf8').then((text) => JSON.parse(text) as StateFoodCollection).catch((error: NodeJS.ErrnoException) => { if (error.code === 'ENOENT') return undefined; throw error })
const collection = await collectStateFoodSecurity(previous)
const updated = integrateStateFoodSecurity(data, collection)
for (const id of new Set(collection.series.map((entry) => entry.indicatorId))) {
  await writeFile(`public/data/series/${id}.json`, JSON.stringify(collection.series.filter((entry) => entry.indicatorId === id)))
}
await writeFile(snapshotPath, JSON.stringify(collection))
updated.generatedAt = new Date().toISOString()
await writeFile(dataPath, JSON.stringify(updated))
console.log(`Segurança alimentar: ${collection.series.length} séries estaduais; cache: ${collection.cached}`)
