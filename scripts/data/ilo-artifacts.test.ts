import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { expect, it } from 'vitest'
import type { DashboardData, Series } from '../../src/types.js'
import { normalizeIlo, parseIloCsv } from './ilo-observations.js'

it('reproduces published series and classification counts from the preserved official CSVs', () => {
  const data = JSON.parse(readFileSync('public/data/mundialidade.json', 'utf8')) as DashboardData
  const audit = JSON.parse(readFileSync('public/data/ilo-observation-audit.json', 'utf8')) as { datasets: Array<{ indicatorId: string; file: string; sha256: string; lastYear: number; reported: number; unknown: number; imputed: number; observations: number }> }
  for (const dataset of audit.datasets) {
    const csv = readFileSync(`public/data/${dataset.file}`)
    expect(createHash('sha256').update(csv).digest('hex')).toBe(dataset.sha256)
    const kind = dataset.indicatorId === 'ilo-unemployment' ? 'unemployment' : 'employment'
    const series = normalizeIlo(parseIloCsv(csv.toString('utf8'), kind), kind, new Map(data.countries.map(c => [c.code, c.name])), dataset.lastYear)
    expect(series).toEqual(JSON.parse(readFileSync(`public/data/series/${dataset.indicatorId}.json`, 'utf8')) as Series[])
    const points = series.flatMap(s => s.points)
    expect(points.length).toBe(dataset.observations)
    for (const type of ['reported', 'unknown', 'imputed'] as const) expect(points.filter(p => p.observationType === type).length).toBe(dataset[type])
  }
})
