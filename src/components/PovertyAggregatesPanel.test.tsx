// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { PovertyAggregatesPanel } from './PovertyAggregatesPanel'
import type { PovertyAggregates } from '../lib/povertyAggregates'
const fixture: PovertyAggregates = {
  fetchedAt: '2026-09-30', lastAttemptAt: '2026-09-30', sourceUpdatedAt: '2026-07-13', cached: true,
  requestUrl: 'https://api.worldbank.org/', geographyUrl: 'https://api.worldbank.org/', metadataUrl: 'https://api.worldbank.org/', methodologyUrl: 'https://data.worldbank.org/', licenseUrl: 'https://data.worldbank.org/',
  indicator: { code: 'SI.POV.UMIC', name: 'Poverty', sourceNote: '2021 PPP', sourceOrganization: 'PIP', povertyLine: 8.3, pppYear: 2021 },
  areas: [{ code: 'BRA', name: 'Brasil', kind: 'country' }, { code: 'ARG', name: 'Argentina', kind: 'country' }, { code: 'WLD', name: 'World', kind: 'world' }, { code: 'LCN', name: 'Latin America & Caribbean', kind: 'region' }],
  series: [
    { areaCode: 'BRA', points: [{ year: 2024, value: 20.6, status: '' }, { year: 2025, value: null, status: '' }] },
    { areaCode: 'ARG', points: [{ year: 2025, value: 0, status: '' }] },
    { areaCode: 'WLD', points: [{ year: 2024, value: 46.1, status: '' }, { year: 2025, value: null, status: '' }] },
    { areaCode: 'LCN', points: [{ year: 2024, value: 24.7, status: '' }] },
  ],
}
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('uses a common year and never substitutes a country or region from another year', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => fixture }))
  const onChange = vi.fn()
  const view = render(<PovertyAggregatesPanel countryCode="BRA" onCountryChange={onChange} />)
  const table = await screen.findByRole('table', { name: /Pobreza abaixo/ })
  expect(within(table).getByRole('row', { name: /Brasil/ })).toHaveTextContent('20,6%')
  expect(within(table).getByRole('row', { name: /Mundo/ })).toHaveTextContent('46,1%')
  fireEvent.change(screen.getByLabelText('Ano da comparação oficial de pobreza'), { target: { value: '2025' } })
  expect(within(table).getByRole('row', { name: /Brasil/ })).toHaveTextContent('Sem observação')
  expect(within(table).getByRole('row', { name: /Latin America/ })).toHaveTextContent('Sem observação')
  fireEvent.change(screen.getByLabelText('País da comparação de pobreza'), { target: { value: 'ARG' } })
  expect(onChange).toHaveBeenCalledWith('ARG')
  view.rerender(<PovertyAggregatesPanel countryCode="ARG" onCountryChange={onChange} />)
  expect(within(table).getByRole('row', { name: /Argentina/ })).toHaveTextContent('0,0%')
  expect(screen.getByText(/A última tentativa falhou/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Baixar pobreza/ })).toHaveAttribute('href', '/data/poverty-aggregates.csv')
})
it('shows a retry on fetch failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => fixture }))
  render(<PovertyAggregatesPanel countryCode="BRA" onCountryChange={() => {}} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('table', { name: /Pobreza abaixo/ })).toBeInTheDocument()
})

it('keeps the world view free of country selection and national rows', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => fixture }))
  render(<PovertyAggregatesPanel />)
  const table = await screen.findByRole('table', { name: /Pobreza abaixo/ })
  expect(within(table).getByRole('row', { name: /Mundo/ })).toHaveTextContent('46,1%')
  expect(within(table).queryByRole('row', { name: /Brasil/ })).not.toBeInTheDocument()
  expect(screen.queryByLabelText('País da comparação de pobreza')).not.toBeInTheDocument()
  expect(within(screen.getByLabelText('Área do histórico de pobreza')).queryByRole('option', { name: 'Brasil' })).not.toBeInTheDocument()
})
