export type ViewMode = 'landing' | 'world' | 'continents' | 'country' | 'states' | 'regions'

export function territorialScope(view: ViewMode, continent: string) {
  return view === 'world' ? 'Todos' : continent
}
