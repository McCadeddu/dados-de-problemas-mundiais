// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { workMigrationFixture } from '../test/workMigrationFixture'
import { LabourObservationStatus } from './LabourObservationStatus'
afterEach(cleanup)
it('counts classification in the selected country and year without converting missing values to zero', () => {
  const data = workMigrationFixture()
  const points = data.series.find(s => s.indicatorId === 'ilo-unemployment' && s.geographyCode === 'AAA')!.points
  for (const point of points) point.observationType = 'reported'
  const vulnerable = data.series.find(s => s.indicatorId === 'ilo-vulnerable-employment' && s.geographyCode === 'AAA')!
  for (const point of vulnerable.points) point.observationType = 'unknown'
  render(<LabourObservationStatus data={data} year={2024} countryCodes={['AAA', 'MISSING']} />)
  const table = screen.getByRole('table', { hidden: true })
  const rows = within(table).getAllByRole('row', { hidden: true })
  expect(within(rows[1]).getAllByRole('cell', { hidden: true }).map(c => c.textContent)).toEqual(['1', '0', '0', '1'])
  expect(within(rows[2]).getAllByRole('cell', { hidden: true }).map(c => c.textContent)).toEqual(['0', '0', '1', '1'])
  expect(screen.getByText(/cruzamento conjunto com migração permanece sem amostra/)).toBeInTheDocument()
})
