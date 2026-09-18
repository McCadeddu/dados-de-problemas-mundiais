// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Indicator, LatestValue, Source } from '../types'
import { DataQualityPanel } from './DataQualityPanel'

const indicator: Indicator = {
  id: 'ilo-unemployment', name: 'Desemprego', themeId: 'decent-work', description: 'Taxa', unit: '%', geographyType: 'country', sourceId: 'world-bank', direction: 'higher-worse', latestYear: 2025,
}
const source: Source = { id: 'world-bank', name: 'Banco Mundial', url: 'https://data.worldbank.org/', methodologyUrl: 'https://data.worldbank.org/', license: 'CC BY 4.0', lastUpdated: '2025' }
const latest = [
  { indicatorId: indicator.id, geographyType: 'country', geographyCode: 'BRA', geographyName: 'Brasil', year: 2024, value: 8 },
  { indicatorId: indicator.id, geographyType: 'country', geographyCode: 'PRT', geographyName: 'Portugal', year: 2025, value: 6 },
] satisfies LatestValue[]

describe('DataQualityPanel', () => {
  it('shows denominator, period and missing territorial coverage', () => {
    render(<DataQualityPanel indicator={indicator} source={source} latest={latest} coverageTotal={3} territoryLabel="países" generatedAt="2026-09-18T12:00:00Z" />)
    expect(screen.getByText('força de trabalho')).toBeInTheDocument()
    expect(screen.getByText('2024–2025')).toBeInTheDocument()
    expect(screen.getByText('2 de 3 países')).toBeInTheDocument()
    expect(screen.getByText(/ausência não é zero/)).toBeInTheDocument()
  })
})
