import { describe, expect, it } from 'vitest'
import Papa from 'papaparse'
import { alignedRowsCsv, alignWorkMigration, pearson } from './workMigration'
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
  it('calculates Pearson for the selected rows and withholds undefined results', () => {
    const rows = alignWorkMigration(workMigrationFixture(), 'unhcr-refugees-hosted').filter((row) => row.year === 2025)
    expect(pearson(rows, 'unemployment')).toBeCloseTo(1)
    expect(pearson(rows.map((row) => ({ ...row, unemployment: -row.unemployment })), 'unemployment')).toBeCloseTo(-1)
    expect(pearson(rows.slice(0, 2), 'unemployment')).toBeNull()
    expect(pearson(rows.map((row) => ({ ...row, unemployment: 10 })), 'unemployment')).toBeNull()
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
