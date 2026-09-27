// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { ForcedLabourPanel } from './ForcedLabourPanel'

afterEach(cleanup)
it('changes regional ordering without confusing counts, prevalence or years', () => {
  render(<ForcedLabourPanel />)
  expect(screen.getByText('27,6 milhões de pessoas')).toBeInTheDocument()
  expect(screen.getByText(/Referência: 2021/)).toBeInTheDocument()
  fireEvent.click(screen.getByText('Explorar modalidades e regiões da OIT'))
  let table = screen.getByRole('table', { name: /Regiões OIT/ })
  expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Estados Árabes8865,3')
  fireEvent.change(screen.getByRole('combobox', { name: 'Ordenar regiões por' }), { target: { value: 'count' } })
  table = screen.getByRole('table', { name: /Regiões OIT/ })
  expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Ásia e Pacífico15.1423,5')
  expect(screen.getByText(/não mudam com seus filtros/)).toBeInTheDocument()
  expect(screen.getByText(/não são recalculadas com a população atual/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Baixar estimativas/ })).toHaveAttribute('href', expect.stringContaining('forced-labour-2021.csv'))
})
