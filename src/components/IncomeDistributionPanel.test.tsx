import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { IncomeDistributionPanel } from './IncomeDistributionPanel'
import { INCOME_DISTRIBUTION, type IncomeDistribution } from '../lib/incomeDistribution'

const fixture: IncomeDistribution = {
  fetchedAt: '2026-10-02', lastAttemptAt: '2026-10-02', sourceUpdatedAt: '2026-07-13', cached: true, licenseUrl: 'https://data.worldbank.org/',
  indicators: INCOME_DISTRIBUTION.map(d => ({ ...d, sourceNote: 'Income or consumption', sourceOrganization: 'World Bank/PIP', requestUrl: 'https://api.worldbank.org/', metadataUrl: 'https://api.worldbank.org/', methodologyUrl: 'https://data.worldbank.org/' })),
  series: INCOME_DISTRIBUTION.map((d, i) => ({ indicatorId: d.id, countryCode: 'BRA', countryName: 'Brasil', points: [{ year: 2023, value: i ? 0 : 40, status: '' }, { year: 2024, value: i ? null : 39.3, status: '' }] })),
}
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('uses only a common year, keeps zero and shows unpaired years solely in history', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => fixture }))
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
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => fixture }))
  render(<IncomeDistributionPanel countryCode="BRA" countryName="Brasil" />)
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByLabelText('Ano comum da distribuição')).toBeInTheDocument()
})
