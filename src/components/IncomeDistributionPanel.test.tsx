import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { IncomeDistributionPanel } from './IncomeDistributionPanel'
import { INCOME_DISTRIBUTION, parseIncomeFootnote, type IncomeDistribution } from '../lib/incomeDistribution'

const fixture: IncomeDistribution = {
  fetchedAt: '2026-10-02', lastAttemptAt: '2026-10-02', sourceUpdatedAt: '2026-07-13', cached: true, licenseUrl: 'https://data.worldbank.org/',
  indicators: INCOME_DISTRIBUTION.map(d => ({ ...d, sourceNote: 'Income or consumption', sourceOrganization: 'World Bank/PIP', requestUrl: 'https://api.worldbank.org/', metadataUrl: 'https://api.worldbank.org/', methodologyUrl: 'https://data.worldbank.org/' })),
  series: INCOME_DISTRIBUTION.map((d, i) => ({ indicatorId: d.id, countryCode: 'BRA', countryName: 'Brasil', points: [{ year: 2023, value: i ? 0 : 40, status: '' }, { year: 2024, value: i ? null : 39.3, status: '' }] })),
}
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('shows survey transitions across missing years and exports the history control', async () => {
  const oldNote = 'Based on data from OLD. Estimated from unit-record income data.'
  const newNote = 'Based on data from NEW. Estimated from unit-record income data.'
  const data = { ...fixture, series: fixture.series.map(s => ({ ...s, points: [
    { year: 2021, value: 0, status: '', sourceFootnote: oldNote, sourceIncomeMetadata: parseIncomeFootnote(oldNote) },
    { year: 2022, value: null, status: '' },
    { year: 2023, value: 4, status: '', sourceFootnote: newNote, sourceIncomeMetadata: parseIncomeFootnote(newNote) },
  ] })) }
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => url.includes('pip-survey-audit') ? { ok: false } : { ok: true, json: async () => data }))
  const view = render(<IncomeDistributionPanel countryCode="BRA" countryName="Brasil" />)
  await screen.findByLabelText('Ano comum da distribuição')
  expect(screen.getByText(/2 transições com mudança declarada/)).toBeVisible()
  expect(screen.getAllByText(/Intervalo de 2 anos; não é uma variação anual/)).toHaveLength(2)
  expect(screen.getByRole('link', { name: 'Baixar controle do histórico (CSV)' })).toHaveAttribute('href', '/data/income-history-review.csv')
  view.rerender(<IncomeDistributionPanel countryCode="ARG" countryName="Argentina" />)
  expect(screen.queryByText(/2 transições com mudança declarada/)).not.toBeInTheDocument()
})
it('shows the WDI declaration and its explicit urban coverage without assigning a PIP candidate', async () => {
  const note = 'Based on data from EPHC-S2. Estimated from unit-record income data. Urban only.'
  const data = { ...fixture, series: fixture.series.map(s => ({ ...s, points: s.points.map(p => ({ ...p, sourceFootnote: note, sourceIncomeMetadata: parseIncomeFootnote(note) })) })) }
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => url.includes('pip-survey-audit') ? { ok: false } : { ok: true, json: async () => data }))
  render(<IncomeDistributionPanel countryCode="BRA" countryName="Brasil" />)
  await screen.findByLabelText('Ano comum da distribuição')
  expect(screen.getAllByText(/Identificação pela WDI: EPHC-S2; conceito renda/)).toHaveLength(2)
  expect(screen.getAllByText(/Cobertura apenas urbana/)).toHaveLength(2)
  expect(screen.getAllByText(`Nota WDI: ${note}`)).toHaveLength(2)
})
it('uses only a common year, keeps zero and shows unpaired years solely in history', async () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => url.includes('pip-survey-audit') ? { ok: false } : { ok: true, json: async () => fixture }))
  const view = render(<IncomeDistributionPanel countryCode="BRA" countryName="Brasil" />)
  const year = await screen.findByLabelText('Ano comum da distribuição')
  expect(year).toHaveValue('2023')
  expect(within(year).queryByRole('option', { name: '2024' })).not.toBeInTheDocument()
  expect(screen.getAllByText('0,0%').length).toBeGreaterThan(0)
  expect(screen.getByText(/não mede patrimônio/)).toBeInTheDocument()
  expect(screen.getByText(/A última tentativa falhou/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Baixar distribuição/ })).toHaveAttribute('href', '/data/income-distribution.csv')
  view.rerender(<IncomeDistributionPanel countryCode="ARG" countryName="Argentina" />)
  expect(screen.getByRole('status')).toHaveTextContent('Sem observações das duas parcelas no mesmo ano')
  expect(screen.queryByText('39,3%')).not.toBeInTheDocument()
})
it('offers retry after failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }).mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => fixture }))
  render(<IncomeDistributionPanel countryCode="BRA" countryName="Brasil" />)
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByLabelText('Ano comum da distribuição')).toBeInTheDocument()
  expect(await screen.findByRole('button', { name: 'Repetir conferência PIP' })).toBeVisible()
})
