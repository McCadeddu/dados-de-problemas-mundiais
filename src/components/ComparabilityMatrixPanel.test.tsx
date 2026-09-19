// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ComparabilityMatrixPanel } from './ComparabilityMatrixPanel'

afterEach(cleanup)

describe('ComparabilityMatrixPanel', () => {
  it('reveals the data-crossing method from an accessible button', () => {
    render(<ComparabilityMatrixPanel />)
    const button = screen.getByRole('button', { name: 'Como cruzamos os dados?' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('heading', { name: 'Como o cruzamento é feito' })).not.toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.getByRole('heading', { name: 'Como o cruzamento é feito' })).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/Dados ausentes ficam fora do cálculo/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar como cruzamos' }))
    expect(screen.queryByRole('heading', { name: 'Como o cruzamento é feito' })).not.toBeInTheDocument()
  })
})
