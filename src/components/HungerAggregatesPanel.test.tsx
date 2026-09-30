// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { afterEach, it, expect, vi } from 'vitest'
import { HungerAggregatesPanel } from './HungerAggregatesPanel'
import { HUNGER_AGGREGATE_INDICATORS as definitions, type HungerAggregates } from '../lib/hungerAggregates'

const fixture: HungerAggregates = {
  fetchedAt: '2026-09-27', lastAttemptAt: '2026-09-27', sourceUpdatedAt: '2026-07-13', cached: true,
  requestUrl: 'https://api.worldbank.org/', areaRequestUrl: 'https://api.worldbank.org/', licenseUrl: 'https://datacatalog.worldbank.org/',
  areas: [{ code: 'WLD', name: 'World' }, { code: 'MEA', name: 'Middle East, North Africa, Afghanistan & Pakistan' }],
  indicators: definitions.map(i => ({ id: i.id, code: i.code, sourceName: i.name, sourceNote: 'Definição oficial', sourceOrganization: 'FAO/JMP', metadataUrl: 'https://api.worldbank.org/', methodologyUrl: 'https://databank.worldbank.org/' })),
  series: definitions.flatMap(i => [
    { indicatorId: i.id, areaCode: 'WLD', points: [{ year: 2023, value: 8.5, status: '' }, { year: 2024, value: i.id === 'wb-undernourishment' ? null : 90, status: '' }] },
    { indicatorId: i.id, areaCode: 'MEA', points: [{ year: 2023, value: 12, status: '' }, { year: 2024, value: null, status: '' }] },
  ]),
}
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('compares the selected country with official aggregates only at the selected year', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => fixture }))
  render(<HungerAggregatesPanel indicatorId="wb-basic-water" countryName="Brasil" countrySeries={{ indicatorId: 'wb-basic-water', geographyCode: 'BRA', geographyName: 'Brasil', geographyType: 'country', points: [{ year: 2023, value: 88 }] }} />)
  expect(await screen.findByRole('row', { name: /País selecionado/ })).toHaveTextContent('Sem observação')
  fireEvent.change(screen.getByRole('combobox', { name: 'Ano dos agregados oficiais' }), { target: { value: '2023' } })
  expect(screen.getByRole('row', { name: /País selecionado/ })).toHaveTextContent('88,0%')
  expect(screen.getByText(/Coletas diferentes podem conter revisões/)).toBeInTheDocument()
})
it('keeps each world reference year and does not fill missing regional data from another year', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => fixture }))
  render(<HungerAggregatesPanel indicatorId="wb-basic-water" />)
  expect(await screen.findByText('Fome e água: agregados oficiais')).toBeInTheDocument()
  expect(screen.getByText('Mundo · ano da fonte: 2023')).toBeInTheDocument()
  let table = screen.getByRole('table', { name: /percentual da população de cada área/ })
  expect(within(table).getByRole('row', { name: /Middle East/ })).toHaveTextContent('Sem observação')
  fireEvent.change(screen.getByRole('combobox', { name: 'Ano dos agregados oficiais' }), { target: { value: '2023' } })
  table = screen.getByRole('table', { name: /percentual da população de cada área/ })
  expect(within(table).getByRole('row', { name: /Middle East/ })).toHaveTextContent('12,0%')
  expect(screen.getByText(/A última tentativa falhou/)).toBeInTheDocument()
  fireEvent.click(screen.getByText('Ver histórico oficial e definição da fonte'))
  expect(screen.getAllByRole('table')).toHaveLength(2)
  expect(screen.getByRole('link', { name: /Baixar agregados/ })).toHaveAttribute('href', expect.stringContaining('hunger-aggregates.csv'))
})
it('reports load failure and can retry without hiding country data', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => fixture }))
  render(<HungerAggregatesPanel indicatorId="wb-undernourishment" />)
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByText('Fome e água: agregados oficiais')).toBeInTheDocument()
})
