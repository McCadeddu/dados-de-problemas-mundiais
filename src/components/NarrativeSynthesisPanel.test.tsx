// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ComparabilityMatrixPanel } from './ComparabilityMatrixPanel'
import { NarrativeSynthesisPanel } from './NarrativeSynthesisPanel'

describe('narrative and comparability panels', () => {
  it('answers the four narrative questions for work', () => {
    render(<NarrativeSynthesisPanel themeId="decent-work" />)
    expect(screen.getByText('Quanto influencia a civilização humana?')).toBeInTheDocument()
    expect(screen.getByText('Quais consequências sociais envolve?')).toBeInTheDocument()
    expect(screen.getByText('Quais são as causas?')).toBeInTheDocument()
    expect(screen.getByText('Como mitigar e quem trabalha para resolver?')).toBeInTheDocument()
  })

  it('discloses the non-causal comparison rule', () => {
    render(<ComparabilityMatrixPanel />)
    expect(screen.getByRole('table', { name: 'Desemprego, vulnerabilidade, contribuição e migração' })).toBeInTheDocument()
    expect(screen.getByText(/não autoriza afirmar que desemprego causa migração/)).toBeInTheDocument()
  })
})
