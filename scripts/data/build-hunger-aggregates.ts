import { readFile, writeFile } from 'node:fs/promises'
import type { HungerAggregates } from '../../src/lib/hungerAggregates.js'
import { collectHungerAggregates, hungerAggregatesCsv } from './hunger-aggregates.js'

const path = 'public/data/hunger-aggregates.json'
let previous: HungerAggregates | undefined
try { previous = JSON.parse(await readFile(path, 'utf8')) as HungerAggregates } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
const result = await collectHungerAggregates(previous)
await writeFile(path, JSON.stringify(result))
await writeFile('public/data/hunger-aggregates.csv', hungerAggregatesCsv(result))
console.log(`Fome e água: ${result.series.length} séries oficiais, mundo e regiões Banco Mundial; coleta anterior: ${result.cached}.`)
