import { describe, expect, it } from 'vitest'
import { continentName, countryInContinent } from './territorialNavigation'

const countries = [
  { code: 'ARG', continent: 'South America' },
  { code: 'BRA', continent: 'South America' },
  { code: 'IND', continent: 'Asia' },
]

describe('territorial filters', () => {
  it('preserves a country that belongs to the chosen continent', () => {
    expect(countryInContinent(countries, 'BRA', 'South America')).toBe('BRA')
    expect(countryInContinent(countries, 'BRA', 'Todos')).toBe('BRA')
  })
  it('selects an available country when the previous choice is outside the continent', () => {
    expect(countryInContinent(countries, 'BRA', 'Asia')).toBe('IND')
    expect(countryInContinent(countries, 'BRA', 'Europe')).toBe('')
  })
  it('translates labels without changing territorial source codes', () => {
    expect(continentName('South America')).toBe('América do Sul')
    expect(continentName('Africa')).toBe('África')
    expect(continentName('Other')).toBe('Other')
    expect(countries[0].continent).toBe('South America')
  })
})
