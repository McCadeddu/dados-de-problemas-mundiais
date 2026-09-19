import { describe, expect, it } from 'vitest'
import Papa from 'papaparse'
import { alignedRowsCsv, alignWorkMigration, alignWorkMigrationChanges, leaveOneOutPearsonRange, pearson, pearsonChanges, spearman, spearmanChanges, weightedPearson, workMigrationExclusions } from './workMigration'
import { workMigrationFixture } from '../test/workMigrationFixture'

describe('work/migration alignment', () => {
  it('keeps published zeros, matches exact country/year and does not carry forward older observations', () => {
    const rows = alignWorkMigration(workMigrationFixture(), 'unhcr-refugees-hosted').filter((row) => row.year === 2025)
    expect(rows.map((row) => row.countryCode)).toEqual(['AAA', 'BBB', 'CCC'])
    expect(rows.map((row) => row.migrationPerThousand)).toEqual([0, 10, 20])
    expect(rows.every((row) => row.population === 100000)).toBe(true)
  })
  it('excludes invalid rates, counts and populations', () => {
    const data = workMigrationFixture()
    data.countryPopulation[0].points[1].value = 0
    data.series.find((s) => s.geographyCode === 'BBB' && s.indicatorId === 'ilo-unemployment')!.points[0].value = NaN
    data.series.find((s) => s.geographyCode === 'CCC' && s.indicatorId === 'unhcr-refugees-hosted')!.points[0].value = -1
    expect(alignWorkMigration(data, 'unhcr-refugees-hosted').filter((row) => row.year === 2025)).toEqual([])
  })
  it('keeps exclusion reasons consistent when a per-capita calculation overflows', () => {
    const data = workMigrationFixture()
    data.countryPopulation[1].points[1].value = Number.MIN_VALUE
    const aligned = alignWorkMigration(data, 'unhcr-refugees-hosted').filter((row) => row.year === 2025)
    expect(aligned.some((row) => row.countryCode === 'BBB')).toBe(false)
    expect(workMigrationExclusions(data, 'unhcr-refugees-hosted', 2025).find((row) => row.countryCode === 'BBB')?.reasons).toEqual(['migração por mil habitantes inválida'])
  })
  it('does not convert invalid inputs into valid ranks', () => {
    const rows = alignWorkMigration(workMigrationFixture(), 'unhcr-refugees-hosted').filter((row) => row.year === 2025)
    rows[0].unemployment = NaN
    expect(spearman(rows, 'unemployment')).toBeNull()
    const changes = alignWorkMigrationChanges(alignWorkMigration(workMigrationFixture(), 'unhcr-refugees-hosted'), 2025)
    changes[0].deltaMigrationPerThousand = Infinity
    expect(spearmanChanges(changes, 'deltaUnemployment')).toBeNull()
  })
  it('calculates Pearson for the selected rows and withholds undefined results', () => {
    const rows = alignWorkMigration(workMigrationFixture(), 'unhcr-refugees-hosted').filter((row) => row.year === 2025)
    expect(pearson(rows, 'unemployment')).toBeCloseTo(1)
    expect(pearson(rows.map((row) => ({ ...row, unemployment: -row.unemployment })), 'unemployment')).toBeCloseTo(-1)
    expect(pearson(rows.slice(0, 2), 'unemployment')).toBeNull()
    expect(pearson(rows.map((row) => ({ ...row, unemployment: 10 })), 'unemployment')).toBeNull()
  })
  it('calculates Spearman from average ranks, including tied values', () => {
    const rows = alignWorkMigration(workMigrationFixture(), 'unhcr-refugees-hosted').filter((row) => row.year === 2025)
    expect(spearman(rows, 'unemployment')).toBeCloseTo(1)
    expect(spearman(rows.map((row) => ({ ...row, unemployment: -row.unemployment })), 'unemployment')).toBeCloseTo(-1)
    expect(spearman(rows.map((row, index) => ({ ...row, unemployment: index === 0 ? 20 : row.unemployment })), 'unemployment')).toBeGreaterThan(0.8)
    expect(spearman(rows.slice(0, 2), 'unemployment')).toBeNull()
  })
  it('exposes population weighting as a distinct sensitivity result', () => {
    const rows = alignWorkMigration(workMigrationFixture(), 'unhcr-refugees-hosted').filter((row) => row.year === 2025)
      .map((row, index) => ({ ...row, unemployment: [10, 60, 30][index], population: [1000, 10, 10][index] }))
    const equalWeight = pearson(rows, 'unemployment')
    const populationWeight = weightedPearson(rows, 'unemployment')
    expect(equalWeight).not.toBeNull()
    expect(populationWeight).not.toBeNull()
    expect(populationWeight).not.toBeCloseTo(equalWeight!, 2)
    expect(weightedPearson(rows.slice(0, 2), 'unemployment')).toBeNull()
  })
  it('reports the influence range after removing one country at a time', () => {
    const baseRows = alignWorkMigration(workMigrationFixture(), 'unhcr-refugees-hosted').filter((row) => row.year === 2025)
    const rows = [...baseRows, { ...baseRows[0], countryCode: 'DDD', countryName: 'País D', unemployment: 40, migrationPerThousand: 30 }]
    const range = leaveOneOutPearsonRange(rows, 'unemployment')
    expect(range?.count).toBe(4)
    expect(range?.min).toBeCloseTo(1)
    expect(range?.max).toBeCloseTo(1)
    expect(leaveOneOutPearsonRange(rows.slice(0, 3), 'unemployment')).toBeNull()
  })
  it('builds exact consecutive-year changes without bridging missing years', () => {
    const rows = alignWorkMigration(workMigrationFixture(), 'unhcr-asylum-seekers-hosted')
    const changes = alignWorkMigrationChanges(rows, 2025)
    expect(changes.map((row) => row.countryCode)).toEqual(['AAA', 'BBB', 'CCC'])
    expect(changes.map((row) => row.deltaMigrationPerThousand)).toEqual([25, 15, 5])
    expect(pearsonChanges(changes, 'deltaUnemployment')).toBeCloseTo(-1)
    expect(spearmanChanges(changes, 'deltaUnemployment')).toBeCloseTo(-1)
    expect(alignWorkMigrationChanges(rows, 2024)).toEqual([])
  })
  it('explains missing or invalid requirements for excluded country/year rows', () => {
    const data = workMigrationFixture()
    const issues = workMigrationExclusions(data, 'unhcr-refugees-hosted', 2025)
    expect(issues).toEqual([{ countryCode: 'DDD', countryName: 'País D', reasons: ['migração ausente'] }])
    data.countryPopulation[0].points[1].value = 0
    expect(workMigrationExclusions(data, 'unhcr-refugees-hosted', 2025).find((item) => item.countryCode === 'AAA')?.reasons).toEqual(['população inválida'])
  })
  it('exports the exact subset with denominator, indicator, snapshot and unrounded values', () => {
    const data = workMigrationFixture()
    const row = { ...alignWorkMigration(data, 'unhcr-refugees-hosted')[0], countryName: 'País "A", região', migrationPerThousand: 1 / 3 }
    const csv = alignedRowsCsv([row], 'unhcr-refugees-hosted', data.generatedAt)
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true })
    expect(parsed.errors).toEqual([])
    expect(parsed.data).toHaveLength(1)
    expect(parsed.data[0]).toMatchObject({ pais: row.countryName, populacao: '100000', migracao_por_1000: String(1 / 3),
      indicador_migratorio: 'unhcr-refugees-hosted', arquivo_gerado_em: data.generatedAt, ano: '2025' })
  })
})
