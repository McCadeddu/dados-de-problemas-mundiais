// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DashboardData, NationalData } from '../types'
import { NationalDataPanel } from './NationalDataPanel'

const dashboard = { indicators: [], latest: [] } as unknown as DashboardData
const payload: NationalData = {
  generatedAt: '2026-09-18',
  registry: [{ countryCode: 'PRT', countryName: 'Portugal', institution: 'INE', url: 'https://www.ine.pt/', evidenceUrl: 'https://unstats.un.org/home/nso_sites/', status: 'directory-listed', checkedAt: '2026-09-18' }],
  poverty: {
    fetchedAt: '2026-09-18', sourceUpdatedAt: '2026-09-17', cached: false,
    sourceUrl: 'https://ec.europa.eu/eurostat/', methodologyUrl: 'https://ec.europa.eu/eurostat/', licenseUrl: 'https://ec.europa.eu/eurostat/', requestUrl: 'https://ec.europa.eu/eurostat/',
    series: [{ countryCode: 'PRT', points: [{ year: 2025, value: 15.4, status: 'p' }] }],
  },
}
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('NationalDataPanel', () => {
  it('shows provenance and does not carry a country estimate to another country or theme', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }))
    const view = render(<NationalDataPanel countryCode="PRT" themeId="poverty-inequality" dashboard={dashboard} />)
    expect(await screen.findByText('Risco de pobreza relativa — EU-SILC')).toBeInTheDocument()
    expect(screen.getByText(/Sinalização da fonte para o último valor: p/)).toBeInTheDocument()
    expect(screen.getByText(/Instituição localizada no diretório/)).toBeInTheDocument()
    view.rerender(<NationalDataPanel countryCode="PRT" themeId="hunger-water" dashboard={dashboard} />)
    expect(screen.queryByText('Risco de pobreza relativa — EU-SILC')).not.toBeInTheDocument()
    view.rerender(<NationalDataPanel countryCode="KEN" themeId="poverty-inequality" dashboard={dashboard} />)
    expect(screen.queryByText('Risco de pobreza relativa — EU-SILC')).not.toBeInTheDocument()
    expect(screen.getByText(/Ainda não há uma série nacional complementar/)).toBeInTheDocument()
  })
  it('shows the next integration step for a priority country', async () => {
    const priorityPayload = { ...payload, registry: [{ ...payload.registry[0], countryCode: 'MEX', countryName: 'Mexico', institution: 'INEGI', status: 'documented' as const }] }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => priorityPayload }))
    render(<NationalDataPanel countryCode="MEX" themeId="decent-work" dashboard={dashboard} />)
    expect(await screen.findByText(/Selecionar uma série INEGI/)).toBeInTheDocument()
  })
  it('recovers from a loading failure on retry', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: true, json: async () => payload })
    vi.stubGlobal('fetch', fetchMock)
    render(<NationalDataPanel countryCode="PRT" themeId="poverty-inequality" dashboard={dashboard} />)
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Risco de pobreza relativa — EU-SILC')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('discloses use of a previous collection when the upstream source failed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...payload, poverty: { ...payload.poverty, cached: true } }) }))
    render(<NationalDataPanel countryCode="PRT" themeId="poverty-inequality" dashboard={dashboard} />)
    expect(await screen.findByText(/A última tentativa falhou/)).toBeInTheDocument()
  })
})
