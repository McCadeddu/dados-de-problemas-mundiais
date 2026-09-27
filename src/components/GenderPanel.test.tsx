// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { DashboardData } from '../types'
import { GenderPanel } from './GenderPanel'
import { genderDefinitions } from '../lib/gender'

const indicator = { id: 'wb-women-violence-recent', themeId: 'gender-equality', geographyType: 'country', ...genderDefinitions['wb-women-violence-recent'] }
const data = {
  indicators: [indicator],
  countries: [{ code: 'BRA', name: 'Brasil', continent: 'South America' }, { code: 'PRT', name: 'Portugal', continent: 'Europe' }, { code: 'ITA', name: 'Itália', continent: 'Europe' }],
  latest: [{ indicatorId: indicator.id, geographyType: 'country', geographyCode: 'BRA', year: 2010, value: 8 }, { indicatorId: indicator.id, geographyType: 'country', geographyCode: 'PRT', year: 2017, value: 4 }],
} as unknown as DashboardData
afterEach(cleanup)

describe('gender coverage', () => {
  it('shows coverage and reference years instead of averaging prevalence', () => {
    render(<GenderPanel data={data} continent="Todos" />)
    const card = within(screen.getByRole('article'))
    expect(card.getByText('2 de 3')).toBeInTheDocument()
    expect(card.getByText('Anos dos últimos dados: 2010–2017.')).toBeInTheDocument()
    expect(card.getByText(/já tiveram parceiro íntimo/)).toBeInTheDocument()
    expect(card.queryByText('6,0%')).not.toBeInTheDocument()
    expect(card.getByRole('link', { name: 'Definição da fonte' })).toHaveAttribute('href', expect.stringContaining('SG.VAW.1549.ZS'))
  })
  it('updates both coverage and periods with the continent filter and explains missing data', () => {
    const view = render(<GenderPanel data={data} continent="Europe" />)
    expect(screen.getByText('1 de 2')).toBeInTheDocument()
    expect(screen.getByText('Anos dos últimos dados: 2017.')).toBeInTheDocument()
    view.rerender(<GenderPanel data={{ ...data, latest: [] }} continent="Europe" />)
    expect(screen.getByText('0 de 2')).toBeInTheDocument()
    expect(screen.getByText('Sem observações neste recorte.')).toBeInTheDocument()
    expect(screen.queryByText(/Infinity/)).not.toBeInTheDocument()
  })
})
