// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ComparisonCoverage } from './ComparisonCoverage'

afterEach(cleanup)

describe('comparison coverage', () => {
  it('reports missing coverage separately from valid observations', () => {
    render(<ComparisonCoverage count={9} total={12} year={2024} loading={false} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '9')
    expect(screen.getByRole('progressbar')).toHaveAttribute('max', '12')
    expect(screen.getByText(/3 sem observação válida/)).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
  it('explains an empty year and filter without treating missing data as zero', () => {
    render(<ComparisonCoverage count={0} total={12} year={2025} loading={false} />)
    expect(screen.getByRole('status')).toHaveTextContent('Ausência de dado não significa valor zero')
    expect(screen.getByRole('status')).toHaveTextContent('Escolha outro ano')
  })
  it('does not report zero coverage while the observations are loading', () => {
    render(<ComparisonCoverage count={0} total={12} year={2024} loading />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})
