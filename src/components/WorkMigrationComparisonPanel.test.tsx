// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Papa from 'papaparse'
import { WorkMigrationComparisonPanel } from './WorkMigrationComparisonPanel'
import { workMigrationFixture } from '../test/workMigrationFixture'

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('WorkMigrationComparisonPanel', () => {
  const getDataTable = () => screen.getAllByRole('table').find((table) => table.querySelector('caption')?.textContent?.includes('por mil habitantes'))!

  it('uses one common year, reports excluded countries and follows the continent filter', () => {
    const data = workMigrationFixture()
    const view = render(<WorkMigrationComparisonPanel data={data} />)
    expect(screen.getByText(/3 de 4 países e territórios incluídos em 2025/)).toBeInTheDocument()
    expect(within(getDataTable()).queryByText('País D')).not.toBeInTheDocument()
    expect(screen.getAllByText('1,00')).toHaveLength(12)
    fireEvent.change(screen.getByLabelText('Ano comum'), { target: { value: '2024' } })
    expect(screen.getByText(/4 de 4 países e territórios incluídos em 2024/)).toBeInTheDocument()
    expect(within(getDataTable()).getByText('País D')).toBeInTheDocument()
    view.rerender(<WorkMigrationComparisonPanel data={data} continent="Asia" />)
    expect(screen.getByText(/1 de 1 países e territórios incluídos em 2024/)).toBeInTheDocument()
    expect(screen.getAllByText('Não calculável')).toHaveLength(10)
    expect(within(getDataTable()).queryByText('País A')).not.toBeInTheDocument()
  })
  it('recalculates asylum and selects the latest available stock year without interpolation', () => {
    render(<WorkMigrationComparisonPanel data={workMigrationFixture()} />)
    fireEvent.change(screen.getByLabelText('Medida migratória'), { target: { value: 'asylum' } })
    expect(screen.getAllByText('-1,00')).toHaveLength(12)
    fireEvent.change(screen.getByLabelText('Medida migratória'), { target: { value: 'stock' } })
    expect(screen.getByText(/4 de 4 países e territórios incluídos em 2024/)).toBeInTheDocument()
    expect(within(screen.getByLabelText('Ano comum')).queryByRole('option', { name: '2025' })).not.toBeInTheDocument()
    expect(screen.getByText(/não devem ser somados/)).toBeInTheDocument()
  })
  it('distinguishes an empty intersection from loading and failure', () => {
    const data = workMigrationFixture()
    const view = render(<WorkMigrationComparisonPanel data={data} continent="Oceania" />)
    expect(screen.getByText(/Sem observações compatíveis/)).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Baixar CSV alinhado' })).toBeDisabled()
    view.rerender(<WorkMigrationComparisonPanel data={{ ...data, series: [] }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando')
    view.rerender(<WorkMigrationComparisonPanel data={{ ...data, series: [] }} loadError="offline" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar')
  })
  it('downloads only the same country/year subset displayed in the table', async () => {
    let exported: Blob | undefined
    vi.stubGlobal('URL', { createObjectURL: vi.fn((blob: Blob) => { exported = blob; return 'blob:export' }), revokeObjectURL: vi.fn() })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<WorkMigrationComparisonPanel data={workMigrationFixture()} continent="Europe" />)
    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: 'Baixar CSV alinhado' }))
    vi.runAllTimers()
    vi.useRealTimers()
    const csv = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsText(exported!)
    })
    const rows = Papa.parse<Record<string, string>>(csv, { header: true }).data
    expect(rows.map((row) => row.codigo_pais)).toEqual(['BBB', 'AAA'])
    expect(rows.every((row) => row.ano === '2025' && row.continente === 'Europe')).toBe(true)
    expect(within(getDataTable()).getAllByRole('row')).toHaveLength(rows.length + 1)
  })
})
