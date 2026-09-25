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
  it('shows Brazilian food security household data only for the hunger theme', async () => {
    const brazil: NationalData = { ...payload, registry: [{ ...payload.registry[0], countryCode: 'BRA', countryName: 'Brasil', institution: 'IBGE', status: 'existing-connector' }], brazilFoodSecurity: {
      fetchedAt: '2026-09-25', lastAttemptAt: '2026-09-25', cached: false,
      sourceUrl: 'https://sidra.ibge.gov.br/tabela/6665', methodologyUrl: 'https://www.ibge.gov.br/biblioteca/visualizacao/livros/liv102084.pdf',
      requestUrl: 'https://apisidra.ibge.gov.br/values/t/6665', points: [{ year: 2023, foodInsecurity: 27.6, moderate: 5.3, severe: 4.1 }, { year: 2024, foodInsecurity: 24.2, moderate: 4.5, severe: 3.2 }],
    } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => brazil }))
    const view = render(<NationalDataPanel countryCode="BRA" themeId="hunger-water" dashboard={dashboard} />)
    expect(await screen.findByText('Segurança alimentar — Brasil (IBGE/PNAD Contínua)')).toBeInTheDocument()
    expect(screen.getAllByText('24,2%').length).toBeGreaterThan(0)
    expect(screen.getByText(/Último ano disponível: 2024/)).toBeInTheDocument()
    expect(screen.getByText(/denominador os domicílios/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /IBGE\/SIDRA/ })).toHaveAttribute('href', brazil.brazilFoodSecurity!.sourceUrl)
    view.rerender(<NationalDataPanel countryCode="BRA" themeId="decent-work" dashboard={dashboard} />)
    expect(screen.queryByText('Segurança alimentar — Brasil (IBGE/PNAD Contínua)')).not.toBeInTheDocument()
  })
  it('shows Indian CWS definition, history and cache provenance only for Indian work', async () => {
    const indian: NationalData = { ...payload, indiaUnemployment: {
      fetchedAt: '2026-09-25', lastAttemptAt: '2026-09-26', cached: true,
      sourceUrl: 'https://www.mospi.gov.in/', methodologyUrl: 'https://www.mospi.gov.in/metadata.pdf',
      accessPolicyUrl: 'https://mospi.gov.in/faq', requestUrl: 'https://api.mospi.gov.in/api/plfs/getData',
      points: [{ period: '2026-07', value: 5.1 }, { period: '2026-08', value: 5 }],
    } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => indian }))
    const view = render(<NationalDataPanel countryCode="IND" themeId="decent-work" dashboard={dashboard} />)
    expect(await screen.findByText('Desemprego mensal — Índia (MoSPI)')).toBeInTheDocument()
    expect(screen.getAllByText('5,0%').length).toBeGreaterThan(0)
    expect(screen.getByText(/mês de referência: 08\/2026/)).toBeInTheDocument()
    expect(screen.getByText(/situação semanal corrente/)).toHaveTextContent('procurou ou esteve disponível')
    expect(screen.getByText(/A última tentativa falhou/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Consulta utilizada (JSON)' })).toHaveAttribute('href', indian.indiaUnemployment!.requestUrl)
    view.rerender(<NationalDataPanel countryCode="IND" themeId="illiteracy" dashboard={dashboard} />)
    expect(screen.queryByText('Desemprego mensal — Índia (MoSPI)')).not.toBeInTheDocument()
    view.rerender(<NationalDataPanel countryCode="ZAF" themeId="decent-work" dashboard={dashboard} />)
    expect(screen.queryByText('Desemprego mensal — Índia (MoSPI)')).not.toBeInTheDocument()
  })
  it('shows the South African definition, vintage and cache warning only for South African work', async () => {
    const southAfrican: NationalData = { ...payload, southAfricaUnemployment: {
      edition: '2026-Q2', sourceUpdatedAt: '2026-08-11', fetchedAt: '2026-09-25', lastAttemptAt: '2026-09-26', cached: true,
      sourceUrl: 'https://www.statssa.gov.za/', methodologyUrl: 'https://www.statssa.gov.za/report.pdf',
      licenseUrl: 'https://www.statssa.gov.za/?page_id=425', requestUrl: 'https://www.statssa.gov.za/trends.xlsx',
      sourceNotes: ['Original source note'], points: [{ period: '2026-Q1', value: 32.7 }, { period: '2026-Q2', value: 33.6 }],
    } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => southAfrican }))
    const view = render(<NationalDataPanel countryCode="ZAF" themeId="decent-work" dashboard={dashboard} />)
    expect(await screen.findByText('Desemprego trimestral — África do Sul (Stats SA)')).toBeInTheDocument()
    expect(screen.getAllByText('33,6%').length).toBeGreaterThan(0)
    expect(screen.getByText(/Pessoas desalentadas/)).toBeInTheDocument()
    expect(screen.getByText(/Publicação consultada: 11\/08\/2026/)).toBeInTheDocument()
    expect(screen.getByText(/A última tentativa falhou/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Planilha oficial utilizada (XLSX)' })).toHaveAttribute('href', southAfrican.southAfricaUnemployment!.requestUrl)
    view.rerender(<NationalDataPanel countryCode="ZAF" themeId="illiteracy" dashboard={dashboard} />)
    expect(screen.queryByText('Desemprego trimestral — África do Sul (Stats SA)')).not.toBeInTheDocument()
    view.rerender(<NationalDataPanel countryCode="IND" themeId="decent-work" dashboard={dashboard} />)
    expect(screen.queryByText('Desemprego trimestral — África do Sul (Stats SA)')).not.toBeInTheDocument()
  })
  it('shows Mexican unemployment, collection caveats and provenance only for Mexican work', async () => {
    const mexican: NationalData = { ...payload, mexicoUnemployment: {
      fetchedAt: '2026-09-25', lastAttemptAt: '2026-09-26', cached: true,
      sourceUrl: 'https://www.inegi.org.mx/', methodologyUrl: 'https://www.inegi.org.mx/', licenseUrl: 'https://www.inegi.org.mx/inegi/terminos.html',
      requestUrl: 'https://www.inegi.org.mx/series.xlsx', precisionUrl: 'https://www.inegi.org.mx/precision.xlsx', sourceNotes: ['Nota original'],
      points: [{ period: '2026-07', value: null, status: 'ND' }, { period: '2026-08', value: 3.0107 }],
    } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => mexican }))
    const view = render(<NationalDataPanel countryCode="MEX" themeId="decent-work" dashboard={dashboard} />)
    expect(await screen.findByText('Desemprego mensal — México (INEGI)')).toBeInTheDocument()
    expect(screen.getAllByText('3,0%').length).toBeGreaterThan(0)
    expect(screen.getByText(/mês de referência: 08\/2026/)).toBeInTheDocument()
    expect(screen.getByText(/Ressalva de coleta/)).toHaveTextContent('Guerrero')
    expect(screen.getByText('Sem observação')).toBeInTheDocument()
    expect(screen.getByText(/A última tentativa falhou/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Planilha oficial utilizada (XLSX)' })).toHaveAttribute('href', mexican.mexicoUnemployment!.requestUrl)
    view.rerender(<NationalDataPanel countryCode="MEX" themeId="illiteracy" dashboard={dashboard} />)
    expect(screen.queryByText('Desemprego mensal — México (INEGI)')).not.toBeInTheDocument()
    view.rerender(<NationalDataPanel countryCode="IND" themeId="decent-work" dashboard={dashboard} />)
    expect(screen.queryByText('Desemprego mensal — México (INEGI)')).not.toBeInTheDocument()
  })
  it('shows the Italian vintage, precision and cache status only in the Italian work view', async () => {
    const italian: NationalData = { ...payload, italyUnemployment: {
      edition: '2026M9G1', sourceUpdatedAt: '2026-09-01', fetchedAt: '2026-09-25', lastAttemptAt: '2026-09-26', cached: true,
      sourceUrl: 'https://esploradati.istat.it/databrowser/', methodologyUrl: 'https://www.istat.it/', licenseUrl: 'https://www.istat.it/note-legali/', requestUrl: 'https://esploradati.istat.it/SDMXWS/',
      points: [{ period: '2026-06', value: null, status: 'c' }, { period: '2026-07', value: 5.778043, status: 'p' }],
    } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => italian }))
    const view = render(<NationalDataPanel countryCode="ITA" themeId="decent-work" dashboard={dashboard} />)
    expect(await screen.findByText('Desemprego mensal — Itália (Istat)')).toBeInTheDocument()
    expect(screen.getAllByText('5,8%').length).toBeGreaterThan(0)
    expect(screen.getByText(/mês de referência: 07\/2026/)).toBeInTheDocument()
    expect(screen.getByText(/01\/09\/2026 \(2026M9G1\)/)).toBeInTheDocument()
    expect(screen.getByText('Sem observação')).toBeInTheDocument()
    expect(screen.getByText(/A última tentativa falhou/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Consulta utilizada (CSV)' })).toHaveAttribute('href', italian.italyUnemployment!.requestUrl)
    view.rerender(<NationalDataPanel countryCode="ITA" themeId="illiteracy" dashboard={dashboard} />)
    expect(screen.queryByText('Desemprego mensal — Itália (Istat)')).not.toBeInTheDocument()
    view.rerender(<NationalDataPanel countryCode="MEX" themeId="decent-work" dashboard={dashboard} />)
    expect(screen.queryByText('Desemprego mensal — Itália (Istat)')).not.toBeInTheDocument()
  })
  it('shows the Portuguese quarterly complement and keeps the poverty and work themes separate', async () => {
    const portuguese: NationalData = { ...payload, portugalUnemployment: {
      fetchedAt: '2026-09-18', lastAttemptAt: '2026-09-19', sourceUpdatedAt: '2026-08-05', cached: true,
      sourceUrl: 'https://www.ine.pt/', methodologyUrl: 'https://www.ine.pt/', licenseUrl: 'https://dados.gov.pt/', requestUrl: 'https://www.ine.pt/',
      sourceNote: 'Estimativas anteriores revistas pelo INE.', points: [{ period: '2026-Q1', value: null, status: 'x', comment: 'Dado não disponível' }, { period: '2026-Q2', value: 5.3 }],
    } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => portuguese }))
    const view = render(<NationalDataPanel countryCode="PRT" themeId="decent-work" dashboard={dashboard} />)
    expect(await screen.findByText('Desemprego trimestral — Portugal (INE)')).toBeInTheDocument()
    expect(screen.getAllByText(/2º trimestre de 2026/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('5,3%').length).toBeGreaterThan(0)
    expect(screen.getByText('Sem observação')).toBeInTheDocument()
    expect(screen.getByText(/Estimativas anteriores revistas pelo INE/)).toBeInTheDocument()
    expect(screen.getByText(/A última tentativa falhou/)).toBeInTheDocument()
    view.rerender(<NationalDataPanel countryCode="PRT" themeId="poverty-inequality" dashboard={dashboard} />)
    expect(screen.getByText('Risco de pobreza relativa — EU-SILC')).toBeInTheDocument()
    expect(screen.queryByText('Desemprego trimestral — Portugal (INE)')).not.toBeInTheDocument()
    view.rerender(<NationalDataPanel countryCode="ITA" themeId="decent-work" dashboard={dashboard} />)
    expect(screen.queryByText('Desemprego trimestral — Portugal (INE)')).not.toBeInTheDocument()
  })
  it('shows monthly ABS data only for Australian work, with period, source precision and cache warning', async () => {
    const absPayload: NationalData = { ...payload, australiaUnemployment: {
      fetchedAt: '2026-09-17', lastAttemptAt: '2026-09-18', cached: true,
      sourceUrl: 'https://www.abs.gov.au/', methodologyUrl: 'https://www.abs.gov.au/', licenseUrl: 'https://www.abs.gov.au/', requestUrl: 'https://data.api.abs.gov.au/',
      points: [{ period: '2026-06', value: null, status: 'M' }, { period: '2026-07', value: 4.46182469 }],
    } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => absPayload }))
    const view = render(<NationalDataPanel countryCode="AUS" themeId="decent-work" dashboard={dashboard} />)
    expect(await screen.findByText('Desemprego mensal — Austrália (ABS)')).toBeInTheDocument()
    expect(screen.getByText(/mês de referência: 07\/2026/)).toBeInTheDocument()
    expect(screen.getAllByText('4,5%').length).toBeGreaterThan(0)
    expect(screen.getByText('Sem observação')).toBeInTheDocument()
    expect(screen.getByText(/A última tentativa falhou/)).toBeInTheDocument()
    expect(screen.getByText(/série anual harmonizada da OIT/)).toBeInTheDocument()
    expect(screen.queryByText(/Ainda não há uma série nacional complementar/)).not.toBeInTheDocument()
    view.rerender(<NationalDataPanel countryCode="AUS" themeId="illiteracy" dashboard={dashboard} />)
    expect(screen.queryByText('Desemprego mensal — Austrália (ABS)')).not.toBeInTheDocument()
    view.rerender(<NationalDataPanel countryCode="IND" themeId="decent-work" dashboard={dashboard} />)
    expect(screen.queryByText('Desemprego mensal — Austrália (ABS)')).not.toBeInTheDocument()
  })
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
    expect(await screen.findByText(/Avaliar informalidade e recortes estaduais/)).toBeInTheDocument()
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
