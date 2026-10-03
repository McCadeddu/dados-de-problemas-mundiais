// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DashboardData } from '../types'
import type { CoverageReport } from '../lib/coverageStatus'
import { CoverageStatusPanel } from './CoverageStatusPanel'

const dashboard = { generatedAt: '2026-10-02', themes: [{ id: 'decent-work', name: 'Trabalho' }], indicators: [] } as unknown as DashboardData
const report: CoverageReport = {
  generatedAt: '2026-10-03', catalogGeneratedAt: dashboard.generatedAt,
  datasets: [{ id: 'national-work', name: 'Complemento de trabalho', themeId: 'decent-work', scope: 'national',
    file: 'national-data.json', available: true, territories: ['PRT'], firstPeriod: '2026-Q2', lastPeriod: '2026-Q2',
    fetchedAt: '2026-09-29', lastAttemptAt: '2026-10-02', cached: true },
  { id: 'international-work', name: 'Série internacional', themeId: 'decent-work', scope: 'country',
    file: 'series/work.json', available: true, territories: ['PRT', 'BRA'], firstPeriod: '2024', lastPeriod: '2024' }],
}
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
const respond = (body: unknown) => ({ ok: true, json: async () => body })

describe('coverage status panel', () => {
  it('separates country observations from world totals and filters declared cache', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(report)))
    render(<CoverageStatusPanel dashboard={dashboard} themeId="decent-work" />)
    await screen.findByText(/1 conjuntos com cache declarado/)
    const matrix = screen.getByRole('table', { name: 'Dados integrados por problemática e âmbito territorial', hidden: true })
    const cells = within(matrix).getAllByRole('cell', { hidden: true })
    expect(cells[0]).toHaveTextContent('Sem dados integrados')
    expect(cells[2]).toHaveTextContent('2 território(s)')
    fireEvent.click(screen.getByText('Ver matriz territorial, fontes e datas de atualização'))
    fireEvent.change(screen.getByLabelText('Conjuntos a consultar'), { target: { value: 'cached' } })
    expect(screen.getByText('Complemento de trabalho')).toBeInTheDocument()
    expect(screen.queryByText('Série internacional')).not.toBeInTheDocument()
    expect(screen.getByText('Coleta anterior (cache)')).toBeInTheDocument()
    expect(screen.getByText('29/09/2026')).toBeInTheDocument()
    expect(screen.getByText('02/10/2026')).toBeInTheDocument()
    expect(screen.getByText(/Estas referências não são contadas/)).toBeInTheDocument()
  })
  it('hides a report for a different catalog version', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond({ ...report, catalogGeneratedAt: 'old-version' })))
    render(<CoverageStatusPanel dashboard={dashboard} themeId="decent-work" />)
    expect(await screen.findByRole('alert')).toHaveTextContent('outra versão da base')
    expect(screen.queryByRole('table', { hidden: true })).not.toBeInTheDocument()
  })
  it('handles invalid files and allows a successful retry', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(respond({ datasets: null })).mockResolvedValueOnce(respond(report))
    vi.stubGlobal('fetch', fetch)
    render(<CoverageStatusPanel dashboard={dashboard} themeId="decent-work" />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Os dados da análise continuam disponíveis')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar carregar diagnóstico novamente' }))
    await screen.findByText(/1 conjuntos com cache declarado/)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
