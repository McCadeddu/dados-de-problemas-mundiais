export type ViewMode = 'landing' | 'world' | 'continents' | 'country' | 'states' | 'regions'

export function territorialScope(view: ViewMode, continent: string) {
  return view === 'world' ? 'Todos' : continent
}

const CONTINENT_NAMES: Record<string, string> = {
  Todos: 'Todos os continentes',
  Africa: 'África',
  Asia: 'Ásia',
  Europe: 'Europa',
  'North America': 'América do Norte',
  'South America': 'América do Sul',
  Oceania: 'Oceania',
}

// Keep the source codes unchanged in filters, chart keys and shared links.
export function continentName(code: string) {
  return CONTINENT_NAMES[code] ?? code
}

export function countryInContinent(countries: Array<{ code: string; continent: string }>, selectedCode: string, continent: string) {
  const available = countries.filter(country => continent === 'Todos' || country.continent === continent)
  return available.some(country => country.code === selectedCode) ? selectedCode : available[0]?.code ?? ''
}
