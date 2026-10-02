import { readFile, writeFile } from 'node:fs/promises'
import type { IncomeDistribution } from '../../src/lib/incomeDistribution.js'
import type { PipSurveyAudit } from '../../src/lib/pipSurveyAudit.js'
import { collectPipSurveyAudit, pipAuditCsv } from './pip-survey-audit.js'

const data = JSON.parse(await readFile('public/data/income-distribution.json', 'utf8')) as IncomeDistribution
let previous: PipSurveyAudit | undefined
try { previous = JSON.parse(await readFile('public/data/pip-survey-audit.json', 'utf8')) } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
const result = await collectPipSurveyAudit(data, previous)
await writeFile('public/data/pip-survey-audit.json', JSON.stringify(result))
await writeFile('public/data/pip-survey-audit.csv', pipAuditCsv(result))
console.log(`PIP ${result.version}: ${result.surveys.length} pesquisas; ${JSON.stringify(result.entries.reduce<Record<string, number>>((counts, row) => { counts[row.status] = (counts[row.status] ?? 0) + 1; return counts }, {}))}; cache=${result.cached}`)
