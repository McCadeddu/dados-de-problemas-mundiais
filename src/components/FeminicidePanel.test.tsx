// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { FeminicidePanel } from './FeminicidePanel'
import { FEMINICIDE_COUNT_ID, FEMINICIDE_RATE_ID } from '../lib/feminicide'

afterEach(cleanup)
it('changes the interpretation with the measure while keeping edition and provenance visible', () => {
  const view = render(<FeminicidePanel indicatorId={FEMINICIDE_RATE_ID} />)
  expect(screen.getByText(/sem padronização por idade/)).toBeInTheDocument()
  expect(screen.getByText('20/02/2026')).toBeInTheDocument()
  expect(screen.getByText(/não é uma consulta em tempo real/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Baixar valores/ })).toHaveAttribute('href', expect.stringContaining('brazil-feminicide.json'))
  view.rerender(<FeminicidePanel indicatorId={FEMINICIDE_COUNT_ID} />)
  expect(screen.getByText(/este ranking não compara risco individual/)).toBeInTheDocument()
  expect(screen.queryByText(/sem padronização por idade/)).not.toBeInTheDocument()
})
