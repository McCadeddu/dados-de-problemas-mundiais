import { readFile, writeFile } from 'node:fs/promises'
import type { IncomeDistribution } from '../../src/lib/incomeDistribution.js'
import { incomeHistoryCsv, incomeHistoryRows } from '../../src/lib/incomeHistory.js'

const data = JSON.parse(await readFile('public/data/income-distribution.json', 'utf8')) as IncomeDistribution
const rows = incomeHistoryRows(data)
await writeFile('public/data/income-history-review.json', JSON.stringify({ reviewedAt: new Date().toISOString(),
  wdiFetchedAt: data.fetchedAt, wdiSourceUpdatedAt: data.sourceUpdatedAt, cachedSource: data.cached, licenseUrl: data.licenseUrl, rows }))
await writeFile('public/data/income-history-review.csv', incomeHistoryCsv(data, rows))
console.log(`Histórico WDI: ${JSON.stringify(rows.reduce<Record<string, number>>((counts, row) => { counts[row.status] = (counts[row.status] ?? 0) + 1; return counts }, {}))}`)
