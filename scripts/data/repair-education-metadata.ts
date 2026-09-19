import { readFile, writeFile } from 'node:fs/promises'
import type { DashboardData } from '../../src/types.js'
import { EDUCATION_WORK_INDICATORS } from './education-work.js'

// Repair source bindings in an existing snapshot without refetching observations.
const path = 'public/data/mundialidade.json'
const data = JSON.parse(await readFile(path, 'utf8')) as DashboardData
const originalSources = new Map(data.sources.map((source) => [source.id, source]))
const sources = new Map(originalSources)
for (const config of EDUCATION_WORK_INDICATORS) {
  const indicator = data.indicators.find((item) => item.id === config.id)
  if (!indicator) throw new Error(`Indicador ausente: ${config.id}`)
  const source = originalSources.get(indicator.sourceId)
  if (!source) throw new Error(`Fonte ausente: ${indicator.sourceId}`)
  indicator.sourceId = config.sourceId
  sources.set(config.sourceId, { ...source, id: config.sourceId,
    methodologyUrl: `https://databank.worldbank.org/metadataglossary/world-development-indicators/series/${config.code}` })
}
data.sources = [...sources.values()]
await writeFile(path, JSON.stringify(data))
