import { readFile, writeFile } from 'node:fs/promises'
import type { PovertyAggregates } from '../../src/lib/povertyAggregates.js'
import { collectPovertyAggregates, povertyAggregatesCsv } from './poverty-aggregates.js'
const path = 'public/data/poverty-aggregates.json'
let previous: PovertyAggregates | undefined
try { previous = JSON.parse(await readFile(path, 'utf8')) as PovertyAggregates } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
const result = await collectPovertyAggregates(previous)
await writeFile(path, JSON.stringify(result))
await writeFile('public/data/poverty-aggregates.csv', povertyAggregatesCsv(result))
console.log(`Pobreza: ${result.areas.filter(a => a.kind === 'country').length} países/territórios, 7 regiões e mundo; coleta anterior: ${result.cached}.`)
