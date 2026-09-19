// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import type { DashboardData } from '../types'
import { IndicatorExplanation } from './IndicatorExplanation'
import { EDUCATION_WORK_INDICATORS } from '../../scripts/data/education-work'

afterEach(cleanup)
const catalog = JSON.parse(readFileSync('public/data/mundialidade.json', 'utf8')) as DashboardData

describe('IndicatorExplanation', () => {
  it('links each education and work measure to its own methodology', () => {
    expect(new Set(EDUCATION_WORK_INDICATORS.map((item) => item.sourceId)).size).toBe(EDUCATION_WORK_INDICATORS.length)
    for (const config of EDUCATION_WORK_INDICATORS) {
      const indicator = catalog.indicators.find((item) => item.id === config.id)!
      const source = catalog.sources.find((item) => item.id === indicator.sourceId)!
      expect(source.methodologyUrl).toBe(`https://databank.worldbank.org/metadataglossary/world-development-indicators/series/${config.code}`)
    }
  })
  it('provides the catalog definition, unit and source for every selectable indicator', () => {
    for (const indicator of catalog.indicators) {
      const source = catalog.sources.find((item) => item.id === indicator.sourceId)
      expect(indicator.description.trim(), indicator.id).not.toBe('')
      expect(source, indicator.id).toBeDefined()
      const view = render(<IndicatorExplanation indicator={indicator} source={source} />)
      const button = screen.getByRole('button', { name: 'O que é e o que mede?' })
      const body = document.getElementById(button.getAttribute('aria-controls')!)!
      expect(body).not.toBeVisible()
      fireEvent.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'true')
      expect(body).toBeVisible()
      expect(screen.getByText(indicator.description)).toBeVisible()
      expect(screen.getByRole('heading', { name: `Como ler a unidade: ${indicator.unit}` })).toBeVisible()
      expect(screen.getByRole('link', { name: 'Definições e metodologia' })).toHaveAttribute('href', source!.methodologyUrl)
      expect(screen.queryByText('A unidade deve ser interpretada conforme a definição e a metodologia da fonte.')).not.toBeInTheDocument()
      view.unmount()
    }
  })

  it('updates an open explanation when the indicator and territorial level change', () => {
    const global = catalog.indicators.find((item) => item.id === 'ilo-unemployment')!
    const regional = catalog.indicators.find((item) => item.id === 'ibge-water-network-coverage')!
    const view = render(<IndicatorExplanation indicator={global} />)
    fireEvent.click(screen.getByRole('button'))
    view.rerender(<IndicatorExplanation indicator={regional} />)
    expect(screen.getByText(regional.description)).toBeVisible()
    expect(screen.queryByText(global.description)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Fechar explicação do indicador' }))
    expect(screen.getByText(regional.description)).not.toBeVisible()
  })
})
