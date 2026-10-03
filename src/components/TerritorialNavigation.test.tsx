// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TerritorialNavigation } from './TerritorialNavigation'
import { territorialScope } from '../lib/territorialNavigation'

afterEach(cleanup)

describe('territorial navigation', () => {
  it('separates world, continents and countries without placing Brazilian subdivisions in the main menu', () => {
    const navigate = vi.fn()
    render(<TerritorialNavigation view="world" onNavigate={navigate} />)
    expect(screen.getAllByRole('button')).toHaveLength(4)
    expect(screen.getByRole('button', { name: /^Mundo/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('button', { name: /UF|IBGE|federado/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Continentes/ }))
    expect(navigate).toHaveBeenLastCalledWith('continents')
    fireEvent.click(screen.getByRole('button', { name: /^Estados/ }))
    expect(navigate).toHaveBeenLastCalledWith('country')
    fireEvent.click(screen.getByRole('button', { name: /^Problemáticas/ }))
    expect(navigate).toHaveBeenLastCalledWith('landing')
  })

  it.each(['country', 'states', 'regions'] as const)('keeps national and subnational view %s inside Estados', view => {
    render(<TerritorialNavigation view={view} onNavigate={vi.fn()} />)
    expect(screen.getByRole('button', { name: /^Estados/ })).toHaveAttribute('aria-current', 'page')
  })

  it('restores worldwide data when returning from a continental filter', () => {
    expect(territorialScope('world', 'Africa')).toBe('Todos')
    expect(territorialScope('continents', 'Africa')).toBe('Africa')
    expect(territorialScope('country', 'Africa')).toBe('Africa')
  })
})
