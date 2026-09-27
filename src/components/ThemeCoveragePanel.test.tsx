// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, it, expect } from 'vitest'
import { ThemeCoveragePanel } from './ThemeCoveragePanel'
import type { Indicator, LatestValue } from '../types'

afterEach(cleanup)
it('shows coverage and year spread without inventing a global Gini or a loading state', () => {
  const indicator = { id: 'wb-gini', name: 'Gini', themeId: 'poverty-inequality', unit: 'índice', geographyType: 'country' } as Indicator
  const latest = [{ indicatorId: 'wb-gini', geographyType: 'country', geographyCode: 'BRA', year: 2020, value: 50 }, { indicatorId: 'wb-gini', geographyType: 'country', geographyCode: 'PRT', year: 2024, value: 30 }] as LatestValue[]
  render(<ThemeCoveragePanel title="Cobertura" indicators={[indicator]} latest={latest} />)
  expect(screen.getByText('2 países e territórios')).toBeInTheDocument()
  expect(screen.getByText('Anos dos últimos dados: 2020–2024.')).toBeInTheDocument()
  expect(screen.getByText(/A média dos Ginis nacionais não mede/)).toBeInTheDocument()
  expect(screen.queryByText(/Carregando/)).not.toBeInTheDocument()
})
