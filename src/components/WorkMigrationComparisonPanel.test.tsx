// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { DashboardData } from '../types'
import { WorkMigrationComparisonPanel } from './WorkMigrationComparisonPanel'

const data = {
  countries: [{ code: 'AAA', name: 'País A', continent: 'Teste' }],
  countryPopulation: [{ geographyCode: 'AAA', points: [{ year: 2024, value: 100000 }, { year: 2025, value: 100000 }] }],
  series: [
    { indicatorId: 'ilo-unemployment', geographyType: 'country', geographyCode: 'AAA', geographyName: 'País A', points: [{ year: 2024, value: 8 }, { year: 2025, value: 7 }] },
    { indicatorId: 'ilo-vulnerable-employment', geographyType: 'country', geographyCode: 'AAA', geographyName: 'País A', points: [{ year: 2024, value: 40 }, { year: 2025, value: 38 }] },
    { indicatorId: 'unhcr-refugees-hosted', geographyType: 'country', geographyCode: 'AAA', geographyName: 'País A', points: [{ year: 2024, value: 1000 }, { year: 2025, value: 1200 }] },
  ],
} as unknown as DashboardData

describe('WorkMigrationComparisonPanel', () => {
  it('aligns country-year observations and discloses the descriptive limit', () => {
    render(<WorkMigrationComparisonPanel data={data} />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('País A')).toBeInTheDocument()
    expect(screen.getByText(/não deve ser lida como efeito/)).toBeInTheDocument()
  })
})
