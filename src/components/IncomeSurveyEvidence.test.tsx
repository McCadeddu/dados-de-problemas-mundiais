import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IncomeSurveyEvidence } from './IncomeSurveyEvidence'
import type { PipSurveyAudit } from '../lib/pipSurveyAudit'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
const audit = { wdiFetchedAt: '2026-10-02', wdiSourceUpdatedAt: '2026-07-13', version: '20260922_2021_01_02_PROD',
  fetchedAt: '2026-10-02', lastAttemptAt: '2026-10-02', cached: false, requestUrl: 'https://api.worldbank.org/pip/v1/pip',
  entries: [{ countryCode: 'BRA', year: 2024, status: 'consistent', candidates: [{ acronym: 'PNADC-E1', welfareType: 'income', surveyYear: 2024, top10: 39.33, bottom20: 3.91, comparableSpell: '2012 - 2024' }] }],
} as PipSurveyAudit

describe('IncomeSurveyEvidence', () => {
  it('shows a candidate with provenance and removes it on country or WDI edition change', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(audit))))
    const view = render(<IncomeSurveyEvidence countryCode="BRA" year={2024} wdiFetchedAt="2026-10-02" />)
    expect(await screen.findByText('PNADC-E1')).toBeVisible()
    expect(screen.getByText('renda')).toBeVisible()
    expect(screen.getByText(/Coincidência numérica não prova/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Consulta PIP com edição fixada' })).toHaveAttribute('href', audit.requestUrl)
    view.rerender(<IncomeSurveyEvidence countryCode="IND" year={2024} wdiFetchedAt="2026-10-02" />)
    expect(screen.getByRole('status')).toHaveTextContent('Sem conferência PIP')
    expect(screen.queryByText('PNADC-E1')).not.toBeInTheDocument()
    view.rerender(<IncomeSurveyEvidence countryCode="BRA" year={2024} wdiFetchedAt="2026-10-03" />)
    expect(screen.getByRole('status')).toHaveTextContent('outra coleta WDI')
    expect(screen.queryByText('PNADC-E1')).not.toBeInTheDocument()
  })
  it('makes divergence and cached evidence explicit without changing the WDI values', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...audit, cached: true, entries: [{ ...audit.entries[0], status: 'divergent' }] }))))
    render(<IncomeSurveyEvidence countryCode="BRA" year={2024} wdiFetchedAt="2026-10-02" />)
    expect(await screen.findByText('Parcelas da PIP divergem da WDI.')).toBeVisible()
    expect(screen.getByText(/coleta PIP falhou/)).toBeVisible()
  })
  it('shows a recoverable error instead of assigning a survey when the evidence cannot load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unavailable', { status: 404 })))
    render(<IncomeSurveyEvidence countryCode="BRA" year={2024} wdiFetchedAt="2026-10-02" />)
    expect(await screen.findByRole('button', { name: 'Repetir conferência PIP' })).toBeVisible()
    expect(screen.queryByText('PNADC-E1')).not.toBeInTheDocument()
  })
})
