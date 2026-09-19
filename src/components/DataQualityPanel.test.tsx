// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
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

afterEach(cleanup)

describe('DataQualityPanel', () => {
  it('shows denominator, period and missing territorial coverage', () => {
    render(<DataQualityPanel indicator={indicator} source={source} latest={latest} coverageTotal={3} territoryLabel="países" generatedAt="2026-09-18T12:00:00Z" />)
    expect(screen.getByText('força de trabalho')).toBeInTheDocument()
    expect(screen.getByText('2024–2025')).toBeInTheDocument()
    expect(screen.getByText('2 de 3 países')).toBeInTheDocument()
    expect(screen.getByText(/ausência não é zero/)).toBeInTheDocument()
  })
  it('does not present a country count or a migrant stock as a rate denominator', () => {
    const props = { source, latest: [], coverageTotal: 3, territoryLabel: 'países', generatedAt: '2026-09-18T12:00:00Z' }
    const view = render(<DataQualityPanel {...props} indicator={{ ...indicator, id: 'wb-migrant-stock', unit: 'pessoas' }} />)
    expect(screen.getByText('Contagem de pessoas; não usa denominador neste indicador.')).toBeInTheDocument()
    view.rerender(<DataQualityPanel {...props} indicator={{ ...indicator, id: 'unknown-rate' }} />)
    expect(screen.getByText(/A cobertura territorial não é o denominador/)).toBeInTheDocument()
  })
})
