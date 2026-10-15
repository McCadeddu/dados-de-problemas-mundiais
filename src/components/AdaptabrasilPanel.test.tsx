// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AdaptabrasilPanel } from './AdaptabrasilPanel'
import type { AdaptaData } from '../lib/adaptabrasil'

const data = JSON.parse(readFileSync('public/data/adaptabrasil.json', 'utf8')) as AdaptaData
const geography = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { sidra_code: '35' }, geometry: { type: 'Polygon', coordinates: [[[-50, -20], [-45, -20], [-45, -15], [-50, -20]]] } }] }
const response = (body: unknown) => ({ ok: true, json: async () => body })
const props = { stateCode: '35', onStateChange: vi.fn(), selectionKey: '2020-present', onSelectionChange: vi.fn(), comparisonCode: '29', onComparisonChange: vi.fn() }
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks() })
function stubFetch(geoFails = false) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('adaptabrasil.json')) return response(data)
    if (geoFails) throw new Error('Map failed')
    return response(geography)
  }))
}
it('distinguishes the present reference from future scenarios and updates both UF values together', async () => {
  stubFetch()
  const view = render(<AdaptabrasilPanel {...props} />)
  await screen.findByText('Referência do presente')
  fireEvent.change(screen.getByLabelText('Referência ou cenário AdaptaBrasil'), { target: { value: '2050-50' } })
  expect(props.onSelectionChange).toHaveBeenCalledWith('2050-50')
  view.rerender(<AdaptabrasilPanel {...props} selectionKey="2050-50" />)
  expect(screen.getByText('Cenário futuro')).toBeInTheDocument()
  const comparison = screen.getByLabelText('Comparação de UFs no mesmo cenário')
  for (const code of ['35', '29']) {
    const row = data.snapshots.find(s => s.key === '2050-50')!.states.find(s => s.code === code)!
    expect(within(comparison).getByText(row.value!.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))).toBeInTheDocument()
  }
  expect(screen.getByText(/não calcula médias de municípios/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Abrir este recorte na fonte oficial' })).toHaveAttribute('href', data.snapshots.find(s => s.key === '2050-50')!.portalUrl)
})
it('keeps tables available when only the geometry fails', async () => {
  stubFetch(true)
  render(<AdaptabrasilPanel {...props} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Valores e tabelas permanecem disponíveis')
  expect(screen.getByRole('table', { hidden: true })).toBeInTheDocument()
})
it('offers retry without interrupting other indicators when the data file fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failed')))
  render(<AdaptabrasilPanel {...props} />)
  expect(await screen.findByText(/Os demais indicadores continuam disponíveis/)).toBeInTheDocument()
  stubFetch()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar carregar AdaptaBrasil novamente' }))
  await screen.findByText('Referência do presente')
})
