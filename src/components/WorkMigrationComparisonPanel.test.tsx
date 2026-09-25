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
  it('explains when loaded series have no common year instead of showing an empty exclusion list', () => {
    const data = workMigrationFixture()
    data.countryPopulation = data.countryPopulation.map((row) => ({ ...row, points: row.points.map((point) => ({ ...point, year: 1900 })) }))
    render(<WorkMigrationComparisonPanel data={data} />)
    expect(screen.getByText(/Não há um ano comum/)).toBeInTheDocument()
    expect(screen.queryByText(/Ver países e territórios excluídos/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Baixar CSV alinhado' })).toBeDisabled()
  })
  it('offers an interpretation of agreement and sensitivity diagnostics', () => {
    render(<WorkMigrationComparisonPanel data={workMigrationFixture()} />)
    fireEvent.click(screen.getByText('Leitura orientativa do cruzamento'))
    expect(screen.getAllByText(/Pearson e Spearman são próximos/)).toHaveLength(2)
    expect(screen.getByText(/Os limiares de diagnóstico são heurísticos/)).toBeInTheDocument()
  })
  it('keeps consecutive-year comparisons inside the selected continent', () => {
    const view = render(<WorkMigrationComparisonPanel data={workMigrationFixture()} continent="Europe" />)
    expect(screen.getByText('Variações dentro dos países: 2 transições exatas')).toBeInTheDocument()
    const changes = screen.getByRole('table', { name: /correlações entre variações/ })
    expect(within(changes).getAllByText('Não calculável')).toHaveLength(4)
    view.rerender(<WorkMigrationComparisonPanel data={workMigrationFixture()} continent="Asia" />)
    expect(screen.getByText('Variações dentro dos países: 1 transições exatas')).toBeInTheDocument()
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
  it('shows and exports the same annual transitions when the measure and continent change', async () => {
    let exported: Blob | undefined
    let filename = ''
    vi.stubGlobal('URL', { createObjectURL: vi.fn((blob: Blob) => { exported = blob; return 'blob:changes' }), revokeObjectURL: vi.fn() })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { filename = this.download })
    const data = workMigrationFixture()
    const view = render(<WorkMigrationComparisonPanel data={data} continent="Europe" />)
    const getChangesTable = () => screen.getByRole('table', { name: /Variações por país/ })
    expect(within(getChangesTable()).getAllByRole('row')).toHaveLength(3)
    expect(within(getChangesTable()).getByText('-20,00')).toBeInTheDocument()
    expect(within(getChangesTable()).queryByText('País C')).not.toBeInTheDocument()
    expect(within(getChangesTable()).queryByText('País D')).not.toBeInTheDocument()
    view.rerender(<WorkMigrationComparisonPanel data={data} continent="Asia" />)
    fireEvent.change(screen.getByLabelText('Medida migratória'), { target: { value: 'asylum' } })
    expect(within(getChangesTable()).getByText('País C')).toBeInTheDocument()
    expect(within(getChangesTable()).getByText('+5,00')).toBeInTheDocument()
    expect(within(getChangesTable()).queryByText('País A')).not.toBeInTheDocument()
    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: 'Baixar CSV das variações' }))
    vi.runAllTimers()
    vi.useRealTimers()
    const csv = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsText(exported!)
    })
    expect(filename).toBe('variacoes-trabalho-migracao-asylum-2024-2025-Asia.csv')
    const rows = Papa.parse<Record<string, string>>(csv, { header: true }).data
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ codigo_pais: 'CCC', continente: 'Asia', ano_anterior: '2024', ano_atual: '2025',
      variacao_migracao_por_1000: '5', indicador_migratorio: 'unhcr-asylum-seekers-hosted' })
    fireEvent.change(screen.getByLabelText('Ano comum'), { target: { value: '2024' } })
    expect(screen.queryByRole('table', { name: /Variações por país/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Baixar CSV das variações' })).toBeDisabled()
    expect(screen.getByText(/Não há países com observações completas nos dois anos/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Medida migratória'), { target: { value: 'stock' } })
    expect(screen.getByRole('button', { name: 'Baixar CSV das variações' })).toBeDisabled()
  })
})
