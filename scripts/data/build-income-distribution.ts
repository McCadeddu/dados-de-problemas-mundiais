import { readFile, writeFile } from 'node:fs/promises'
import type { DashboardData, Series } from '../../src/types.js'
import { INCOME_DISTRIBUTION, incomeIndicator, type IncomeDistribution } from '../../src/lib/incomeDistribution.js'
import { collectIncomeDistribution, incomeDistributionCsv } from './income-distribution.js'

const data = JSON.parse(await readFile('public/data/mundialidade.json', 'utf8')) as DashboardData
let previous: IncomeDistribution | undefined
try { previous = JSON.parse(await readFile('public/data/income-distribution.json', 'utf8')) } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
const result = await collectIncomeDistribution(data.countries, previous)
const ids = new Set(INCOME_DISTRIBUTION.map(d => d.id))
data.indicators = data.indicators.filter(i => !ids.has(i.id))
data.latest = data.latest.filter(i => !ids.has(i.indicatorId))
data.rankings = data.rankings.filter(i => !ids.has(i.indicatorId))
for (const definition of INCOME_DISTRIBUTION) {
  const series: Series[] = result.series.filter(s => s.indicatorId === definition.id).map(s => ({ indicatorId: s.indicatorId, geographyType: 'country' as const, geographyCode: s.countryCode, geographyName: s.countryName,
    points: s.points.filter(p => p.value !== null).map(p => ({ year: p.year, value: p.value!, sourceObservationStatus: p.status, sourceFootnote: p.sourceFootnote, sourceIncomeMetadata: p.sourceIncomeMetadata })) })).filter(s => s.points.length)
  const latest = series.map(s => ({ indicatorId: s.indicatorId, geographyType: s.geographyType, geographyCode: s.geographyCode, geographyName: s.geographyName, ...s.points.at(-1)! }))
  const latestYear = Math.max(...latest.map(p => p.year))
  data.indicators.push(incomeIndicator(definition, latestYear))
  data.latest.push(...latest)
  data.rankings.push({ indicatorId: definition.id, geographyType: 'country', year: latestYear, items: [...latest].sort((a, b) => b.value - a.value) })
  await writeFile(`public/data/series/${definition.id}.json`, JSON.stringify(series))
  console.log(`${definition.id}: ${series.length} países com observações; até ${latestYear}`)
}
await writeFile('public/data/income-distribution.json', JSON.stringify(result))
await writeFile('public/data/income-distribution.csv', incomeDistributionCsv(result))
await writeFile('public/data/mundialidade.json', JSON.stringify(data))
// Keep the downloadable coverage diagnosis consistent after this standalone collector.
try {
  const coverage = JSON.parse(await readFile('public/data/country-coverage.json', 'utf8')) as {
    incomeDistributionUpdatedAt?: string
    countries: { countryCode: string; indicators: { indicatorId: string; themeId: string; year: number | null; hasData: boolean }[] }[]
  }
  for (const country of coverage.countries) {
    country.indicators = country.indicators.filter(i => !ids.has(i.indicatorId))
    for (const definition of INCOME_DISTRIBUTION) {
      const observation = data.latest.find(i => i.indicatorId === definition.id && i.geographyCode === country.countryCode)
      country.indicators.push({ indicatorId: definition.id, themeId: 'poverty-inequality', year: observation?.year ?? null, hasData: Boolean(observation) })
    }
  }
  coverage.incomeDistributionUpdatedAt = result.lastAttemptAt
  await writeFile('public/data/country-coverage.json', JSON.stringify(coverage))
} catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
console.log(`Distribuição: coleta ${result.fetchedAt}; cache=${result.cached}`)
