// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { FeatureCollection } from 'geojson'
import { MapPanel } from './MapPanel'

const geography: FeatureCollection = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { code: 'BR', name: 'Brasil' },
    geometry: { type: 'Polygon', coordinates: [[[-50, -20], [-45, -20], [-45, -15], [-50, -20]]] },
  }],
}

describe('MapPanel', () => {
  it('uses a fixed index domain instead of stretching each scenario to its own minimum and maximum', () => {
    const { container, unmount } = render(<MapPanel title="Risco" subtitle="Cenário" geography={geography}
      valueByCode={new Map([['BR', { name: 'Brasil', value: .49 }]])} codeKeys={['code']} onSelect={() => {}}
      valueDomain={[0, 1]} colors={['#02C650', '#A9DE00', '#FFCD00', '#FF8300', '#F40000']} />)
    expect(container.querySelector('svg path')).toHaveAttribute('fill', '#FFCD00')
    unmount()
  })
  it('selects a territory with the keyboard and exposes its value', () => {
    const onSelect = vi.fn()
    render(
      <MapPanel
        title="Mapa de teste"
        subtitle="Indicador de teste"
        geography={geography}
        valueByCode={new Map([['BR', { name: 'Brasil', value: 42.5 }]])}
        codeKeys={['code']}
        onSelect={onSelect}
        selectedCode="BR"
        formatValue={(value) => `${value}%`}
      />,
    )

    const territory = screen.getByRole('button', { name: 'Brasil: 42.5%' })
    expect(territory).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(territory, { key: ' ' })
    expect(onSelect).toHaveBeenCalledWith('BR')
    expect(screen.getByText(/Use Tab para navegar/)).toBeInTheDocument()
  })
})
