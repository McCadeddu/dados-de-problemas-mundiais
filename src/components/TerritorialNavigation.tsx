import type { ViewMode } from '../lib/territorialNavigation'

export function TerritorialNavigation({ view, onNavigate }: { view: ViewMode; onNavigate: (view: ViewMode) => void }) {
  const nationalView = view === 'country' || view === 'states' || view === 'regions'
  return <nav className="view-switcher" aria-label="Âmbito territorial">
    <button onClick={() => onNavigate('landing')}>Problemáticas<span>Escolher o tema da análise</span></button>
    <button className={view === 'world' ? 'is-active' : ''} aria-current={view === 'world' ? 'page' : undefined} onClick={() => onNavigate('world')}>Mundo<span>Dados e panorama mundial</span></button>
    <button className={view === 'continents' ? 'is-active' : ''} aria-current={view === 'continents' ? 'page' : undefined} onClick={() => onNavigate('continents')}>Continentes<span>Escolher e analisar o recorte continental</span></button>
    <button className={nationalView ? 'is-active' : ''} aria-current={nationalView ? 'page' : undefined} onClick={() => onNavigate('country')}>Estados<span>Escolher e comparar países soberanos</span></button>
  </nav>
}

