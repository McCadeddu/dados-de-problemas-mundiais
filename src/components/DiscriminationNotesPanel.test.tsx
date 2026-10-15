// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { DiscriminationNotesPanel } from './DiscriminationNotesPanel'
import type { Series } from '../types'
afterEach(cleanup)
const series: Series[] = [{ indicatorId: 'un-discrimination-12-months', geographyType: 'country', geographyCode: 'BRA', geographyName: 'Brasil',
  points: [{ year: 2022, value: 0, sourceFootnote: 'Pesquisa A; Age: 18 years and over.' }, { year: 2023, value: 7, sourceFootnote: 'Pesquisa B' }] }]
it('shows a valid zero with its original population note and never substitutes another year', () => {
  const view = render(<DiscriminationNotesPanel series={series} year={2022} loading={false} />)
  expect(screen.getByText('0%')).toBeInTheDocument()
  expect(screen.getByText(/Pesquisa A; Age/)).toBeInTheDocument()
  expect(screen.queryByText('Pesquisa B')).not.toBeInTheDocument()
  view.rerender(<DiscriminationNotesPanel series={series} year={2024} loading={false} />)
  expect(within(screen.getByRole('table', { hidden: true })).queryAllByRole('cell', { hidden: true })).toHaveLength(0)
  expect(screen.getByText(/Não há observações elegíveis/)).toBeInTheDocument()
})
it('shows loading without declaring an empty selection', () => {
  render(<DiscriminationNotesPanel series={[]} year={2024} loading />)
  expect(screen.getByRole('status')).toHaveTextContent('Carregando notas')
  expect(screen.queryByText(/Não há observações elegíveis/)).not.toBeInTheDocument()
})
