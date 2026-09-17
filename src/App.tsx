import { type CSSProperties, useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MapPanel } from './components/MapPanel'
import {
  formatValue,
  getDefaultIndicator,
  getIndicator,
  getIndicatorsByTheme,
  getLatestByIndicator,
  getMetricSummary,
  getPopulationWeightedAverage,
  getSafeThemeId,
  getSeriesForGeography,
  getTopRanked,
} from './lib/dashboard'
import type { DashboardData, LatestValue } from './types'

type GeoJson = GeoJSON.FeatureCollection
type ViewMode = 'world' | 'country' | 'states' | 'regions'

const initialParams = new URLSearchParams(window.location.search)

function initialView(): ViewMode {
  const value = initialParams.get('visao')
  return value === 'country' || value === 'states' || value === 'regions' || value === 'world' ? value : 'world'
}

function initialValue(key: string, fallback: string) {
  return initialParams.get(key) ?? fallback
}

function initialCodes(key: string, fallback: string[]) {
  const value = initialParams.get(key)
  return value ? value.split(',').filter(Boolean).slice(0, 5) : fallback
}

function App() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [worldGeo, setWorldGeo] = useState<GeoJson | null>(null)
  const [brazilGeo, setBrazilGeo] = useState<GeoJson | null>(null)
  const [brazilMapError, setBrazilMapError] = useState<string | null>(null)
  const [brazilMapLoadAttempt, setBrazilMapLoadAttempt] = useState(0)
  const [view, setView] = useState<ViewMode>(initialView)
  const [themeId, setThemeId] = useState(() => initialValue('tema', 'hunger-water'))
  const [selectedIndicatorId, setSelectedIndicatorId] = useState(() => initialValue('indicador', ''))
  const [continent, setContinent] = useState(() => initialValue('continente', 'Todos'))
  const [countryCode, setCountryCode] = useState(() => initialValue('pais', 'BRA'))
  const [stateCode, setStateCode] = useState(() => initialValue('uf', '35'))
  const [stateIndicatorId, setStateIndicatorId] = useState(() => initialValue('indicadorEstadual', 'sidra-bolsa-familia'))
  const [immediateRegionCode, setImmediateRegionCode] = useState(() => initialValue('regiao', '350001'))
  const [immediateIndicatorId, setImmediateIndicatorId] = useState(() => initialValue('indicadorRegional', 'ibge-water-network-coverage'))
  const [comparisonCountryCodes, setComparisonCountryCodes] = useState(() => initialCodes('compararPaises', ['BRA', 'IND', 'ZAF']))
  const [comparisonContinentCodes, setComparisonContinentCodes] = useState(() => initialCodes('compararContinentes', ['Africa', 'Asia', 'Europe']))
  const [comparisonStateCodes, setComparisonStateCodes] = useState(() => initialCodes('compararEstados', ['35', '29', '15']))
  const [comparisonImmediateRegionCodes, setComparisonImmediateRegionCodes] = useState(() => initialCodes('compararRegioes', ['350019', '350048', '350024']))
  const [copied, setCopied] = useState(false)
  const [clockNow, setClockNow] = useState(() => Date.now())
  const activeThemeId = data ? getSafeThemeId(data, themeId) : themeId

  useEffect(() => {
    const intervalId = window.setInterval(() => setClockNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const dataBaseUrl = import.meta.env.BASE_URL
    const loadJson = async <T,>(url: string) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Não foi possível carregar ${url}.`)
      return response.json() as Promise<T>
    }
    Promise.all([
      loadJson<DashboardData>(`${dataBaseUrl}data/mundialidade.json`),
      loadJson<GeoJson>(`${dataBaseUrl}data/geo/world.geojson`),
    ]).then(([dashboardData, world]) => {
      setData(dashboardData)
      setWorldGeo(world)
    }).catch(() => setLoadError('Não foi possível carregar os dados do painel. Verifique a conexão e tente novamente.'))
  }, [loadAttempt])

  useEffect(() => {
    if (!data || brazilGeo || view !== 'states') return
    const dataBaseUrl = import.meta.env.BASE_URL
    fetch(`${dataBaseUrl}data/geo/brazil-states.geojson`)
      .then((response) => {
        if (!response.ok) throw new Error('Mapa indisponível')
        return response.json() as Promise<GeoJson>
      })
      .then((brazil) => {
        setBrazilGeo(brazil)
        setBrazilMapError(null)
      })
      .catch(() => setBrazilMapError('Não foi possível carregar o mapa dos estados.'))
  }, [brazilGeo, brazilMapLoadAttempt, data, view])

  useEffect(() => {
    const params = new URLSearchParams({
      visao: view,
      tema: activeThemeId,
      indicador: selectedIndicatorId,
      continente: continent,
      pais: countryCode,
      uf: stateCode,
      indicadorEstadual: stateIndicatorId,
      regiao: immediateRegionCode,
      indicadorRegional: immediateIndicatorId,
      compararPaises: comparisonCountryCodes.join(','),
      compararContinentes: comparisonContinentCodes.join(','),
      compararEstados: comparisonStateCodes.join(','),
      compararRegioes: comparisonImmediateRegionCodes.join(','),
    })
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
  }, [activeThemeId, comparisonContinentCodes, comparisonCountryCodes, comparisonImmediateRegionCodes, comparisonStateCodes, continent, countryCode, immediateIndicatorId, immediateRegionCode, selectedIndicatorId, stateCode, stateIndicatorId, view])

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      window.prompt('Copie o link desta análise:', window.location.href)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const themeIndicators = data ? getIndicatorsByTheme(data, activeThemeId).filter(
    (item) => item.geographyType === 'country',
  ) : []
  const indicatorId = themeIndicators.some((item) => item.id === selectedIndicatorId)
    ? selectedIndicatorId
    : data
      ? getDefaultIndicator(data, activeThemeId)?.id ?? ''
      : ''
  const indicator = data && indicatorId ? getIndicator(data, indicatorId) : undefined
  const brazilIndicators = data?.indicators.filter((item) => item.geographyType === 'brazil-state') ?? []
  const stateThemeIndicators = brazilIndicators.filter((item) => item.themeId === activeThemeId)
  const brazilIndicator = stateThemeIndicators.find((item) => item.id === stateIndicatorId) ?? stateThemeIndicators[0] ?? brazilIndicators[0]
  const effectiveView = view === 'states' && stateThemeIndicators.length === 0 ? 'world' : view
  const immediateIndicators = data?.indicators.filter(
    (item) => item.geographyType === 'brazil-immediate-region',
  ) ?? []
  const immediateRegionIndicator = immediateIndicators.find((item) => item.id === immediateIndicatorId)
    ?? immediateIndicators[0]
  const selectedCountrySeries = data && indicator
    ? getSeriesForGeography(data, indicator.id, countryCode)
    : undefined
  const selectedStateSeries = data && brazilIndicator
    ? getSeriesForGeography(data, brazilIndicator.id, stateCode)
    : undefined
  const countryLatest = data && indicator ? getLatestByIndicator(data, indicator.id, 'country') : []
  const brazilLatest = data && brazilIndicator
    ? getLatestByIndicator(data, brazilIndicator.id, 'brazil-state')
      : []

  const worldValueByCode = new Map(countryLatest.map((item) => [
    item.geographyCode,
    { name: item.geographyName, value: item.value },
  ]))
  const brazilValueByCode = new Map(brazilLatest.map((item) => [
    item.geographyCode,
    { name: item.geographyName, value: item.value },
  ]))

  if (loadError) {
    return <main className="shell load-error"><h1>Falha ao abrir o painel</h1><p>{loadError}</p><button className="advance-button" onClick={() => { setLoadError(null); setLoadAttempt((attempt) => attempt + 1) }}>Tentar novamente</button></main>
  }
  if (!data || !worldGeo || !indicator || !brazilIndicator || !immediateRegionIndicator) {
    return <main className="shell"><p>Carregando painel e séries...</p></main>
  }

  const summary = getMetricSummary(data)
  const worldPopulation = data.worldPopulation
    ? Math.round(data.worldPopulation.value + (data.worldPopulation.annualChange * ((clockNow - new Date(data.worldPopulation.referenceYear, 0, 1).getTime()) / (365.25 * 24 * 60 * 60 * 1000))))
    : null
  const countryName = data.countries.find((country) => country.code === countryCode)?.name ?? countryCode
  const stateName = data.brazilStates.find((state) => state.code === stateCode)?.name ?? stateCode
  const activeIndicator = effectiveView === 'world' || effectiveView === 'country'
    ? indicator
    : view === 'states'
      ? brazilIndicator
      : immediateRegionIndicator
  const activeSource = data.sources.find((source) => source.id === activeIndicator.sourceId)
  const activeLatest = getLatestByIndicator(data, activeIndicator.id, activeIndicator.geographyType)
  const activeCoverageTotal = activeIndicator.geographyType === 'country'
    ? data.countries.length
    : activeIndicator.geographyType === 'brazil-state'
      ? data.brazilStates.length
      : data.brazilImmediateRegions.length
  const activeTerritoryLabel = activeIndicator.geographyType === 'country'
    ? 'países'
    : activeIndicator.geographyType === 'brazil-state'
      ? 'estados'
      : 'regiões imediatas'
  const directionLabel = activeIndicator.direction === 'higher-worse'
    ? 'Valores maiores indicam maior pressão ou vulnerabilidade.'
    : 'Valores maiores indicam maior acesso, proteção ou capacidade.'
  const activeRanking = getTopRanked(data, activeIndicator.id, 10)
  const filteredCountries = continent === 'Todos'
    ? data.countries
    : data.countries.filter((country) => country.continent === continent)
  const worldRanking = activeRanking.filter((item) => {
    const country = data.countries.find((candidate) => candidate.code === item.geographyCode)
    return continent === 'Todos' || country?.continent === continent
  })
  const continentValues = countryLatest.filter((item) => {
    const country = data.countries.find((candidate) => candidate.code === item.geographyCode)
    return continent === 'Todos' || country?.continent === continent
  })
  const continentAverage = getPopulationWeightedAverage(data, continentValues)
  const regionsForState = data.brazilImmediateRegions.filter((region) => region.stateCode === stateCode)
  const selectedImmediateRegion = data.brazilImmediateRegions.find(
    (region) => region.code === immediateRegionCode)
  const selectedImmediateSeries = getSeriesForGeography(
    data,
    immediateRegionIndicator.id,
    immediateRegionCode,
  )
  const comparisonStates = data.brazilStates.filter((state) => comparisonStateCodes.includes(state.code))
  const comparisonLatest = brazilLatest.filter((item) => comparisonStateCodes.includes(item.geographyCode))
  const comparisonChartData = buildComparisonChartData(data, brazilIndicator.id, comparisonStates)
  const comparisonCountries = filteredCountries.filter((country) => comparisonCountryCodes.includes(country.code))
  const comparisonCountryLatest = countryLatest.filter((item) => comparisonCountryCodes.includes(item.geographyCode))
  const comparisonCountryChartData = buildComparisonChartData(data, indicator.id, comparisonCountries)
  const continentTerritories = data.continents.map((name) => ({ code: name, name }))
  const comparisonContinents = continentTerritories.filter((item) => comparisonContinentCodes.includes(item.code))
  const continentLatest = buildContinentLatestValues(data, indicator.id)
  const comparisonContinentLatest = continentLatest.filter((item) => comparisonContinentCodes.includes(item.geographyCode))
  const comparisonContinentChartData = buildContinentComparisonChartData(data, indicator.id, comparisonContinents)
  const comparisonImmediateRegions = regionsForState.filter((region) => comparisonImmediateRegionCodes.includes(region.code))
  const comparisonImmediateLatest = getLatestByIndicator(data, immediateRegionIndicator.id, 'brazil-immediate-region').filter(
    (item) => comparisonImmediateRegionCodes.includes(item.geographyCode),
  )
  const comparisonImmediateChartData = buildComparisonChartData(data, immediateRegionIndicator.id, comparisonImmediateRegions)
  const tooltipFormatter = (unit: string) => (value: unknown) => {
    if (Array.isArray(value)) return String(value[0] ?? '')
    return formatValue(Number(value ?? 0), unit)
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <span className="eyebrow">Dashboard open-source socioambiental</span>
          <h1>{import.meta.env.VITE_APP_TITLE ?? 'Mundialidade'}</h1>
          <p className="lead">
            Indicadores públicos para acompanhar desafios socioambientais em duas escalas:
            comparações entre países e leitura detalhada dos estados brasileiros.
          </p>
          <button className="share-button" onClick={() => void copyShareLink()}>{copied ? 'Link copiado' : 'Copiar link desta análise'}</button>
        </div>
        <div className="hero__grid">
          <article className="stat"><strong>{summary.countries}</strong><span>países comparáveis</span></article>
          <article className="stat"><strong>{summary.states}</strong><span>estados brasileiros</span></article>
          <article className="stat"><strong>{data.indicators.length}</strong><span>indicadores ativos</span></article>
          <article className="stat"><strong>{new Date(data.generatedAt).toLocaleDateString('pt-BR')}</strong><span>gerado em</span></article>
          {worldPopulation !== null && <article className="stat stat--population"><strong>{worldPopulation.toLocaleString('pt-BR')}</strong><span>estimativa da população mundial</span><small>Base {data.worldPopulation?.referenceYear} • atualização por segundo</small></article>}
        </div>
      </section>

      {worldPopulation !== null && <p className="population-note">Contador estimado a partir da população mundial anual e da variação anual mais recente do World Bank; não representa uma contagem em tempo real.</p>}

      <section className="theme-picker" aria-label="Escolher problemática">
        <div className="theme-picker__intro"><span>Primeiro passo</span><h2>Escolha a problemática</h2><p>O panorama mundial abre com os indicadores disponíveis para o tema selecionado.</p></div>
        <div className="theme-picker__options">
          {data.themes.map((theme) => <button key={theme.id} className={activeThemeId === theme.id ? 'is-active' : ''} onClick={() => { setThemeId(theme.id); setSelectedIndicatorId(''); setView('world') }}><strong>{theme.name}</strong><span>{theme.description}</span></button>)}
        </div>
      </section>

      <nav className="view-switcher" aria-label="Escala de análise">
        <button className={effectiveView === 'world' ? 'is-active' : ''} onClick={() => setView('world')}>
          1. Mundo
          <span>Panorama, continentes e comparação entre países</span>
        </button>
        <button className={view === 'country' ? 'is-active' : ''} onClick={() => setView('country')}>
          2. País
          <span>{countryName}: leitura nacional e passagem ao detalhe</span>
        </button>
        <button className={effectiveView === 'states' ? 'is-active' : ''} onClick={() => setView('states')} disabled={stateThemeIndicators.length === 0} title={stateThemeIndicators.length === 0 ? 'Ainda não há indicador estadual para esta problemática.' : undefined}>
          3. Brasil: estados
          <span>Comparar unidades federativas equivalentes</span>
        </button>
        <button className={view === 'regions' ? 'is-active' : ''} onClick={() => setView('regions')}>
          4. Regiões IBGE
          <span>Comparar Regiões Geográficas Imediatas</span>
        </button>
      </nav>

      <p className="hierarchy" aria-label="Caminho de análise">
        Problemática: <strong>{data.themes.find((theme) => theme.id === activeThemeId)?.name}</strong>
        <span>›</span> {effectiveView === 'world' ? 'Mundo' : effectiveView === 'country' ? `Mundo › ${countryName}` : effectiveView === 'states' ? 'Brasil › Estados' : `Brasil › ${stateName} › Regiões Imediatas`}
      </p>

      {effectiveView === 'world' ? (
        <>
          <section className="panel controls controls--world">
            <label>Indicador<select value={indicatorId} onChange={(event) => setSelectedIndicatorId(event.target.value)}>{themeIndicators.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Continente<select value={continent} onChange={(event) => { const nextContinent = event.target.value; const nextCountries = nextContinent === 'Todos' ? data.countries : data.countries.filter((country) => country.continent === nextContinent); setContinent(nextContinent); setCountryCode(nextCountries[0]?.code ?? ''); setComparisonCountryCodes(nextCountries.slice(0, 3).map((country) => country.code)) }}><option value="Todos">Mundo inteiro</option>{data.continents.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label>País<select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>{filteredCountries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
          </section>

          <section className="content-grid content-grid--world">
            <MapPanel title="Mapa mundial" subtitle={`${indicator.name} • clique para abrir a análise de um país`} geography={worldGeo} valueByCode={worldValueByCode} codeKeys={['ADM0_A3', 'ISO_A3', 'SOV_A3', 'gu_a3']} onSelect={(code) => { setCountryCode(code); setContinent(data.countries.find((country) => country.code === code)?.continent ?? 'Todos'); setView('country') }} selectedCode={countryCode} formatValue={(value) => formatValue(value, indicator.unit)} direction={indicator.direction} projectionKind="peters" />
            <article className="panel">
              <div className="panel__header"><div><h3>{countryName || continent}</h3><p>{indicator.description}</p>{continentAverage && <p className="context-metric">Média do recorte, ponderada pela população: {formatValue(continentAverage.value, indicator.unit)} ({continentAverage.coverage} países)</p>}</div><strong className="badge">{indicator.latestYear}</strong></div>
              <div className="chart"><ResponsiveContainer width="100%" height={300}><LineChart data={selectedCountrySeries?.points ?? []}><CartesianGrid stroke="#334155" strokeDasharray="4 4" /><XAxis dataKey="year" stroke="#a8b8cc" /><YAxis stroke="#a8b8cc" /><Tooltip formatter={tooltipFormatter(indicator.unit)} /><Line type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div>
              <p className="meta">Fonte: <a href={activeSource?.url}>{activeSource?.name}</a> • Atualização conhecida: {activeSource?.lastUpdated}</p>
            </article>
          </section>
          <RankingPanel title={continent === 'Todos' ? 'Ranking global' : `Ranking: ${continent}`} description="10 países com os maiores valores para o indicador e recorte selecionados." ranking={worldRanking} unit={indicator.unit} direction={indicator.direction} color="#2563eb" tooltipFormatter={tooltipFormatter} />
          <TerritoryComparisonPanel
            title="Comparar continentes"
            description="Média ponderada pela população, usando apenas países com dados do indicador e população no mesmo ano."
            territories={continentTerritories}
            selectedCodes={comparisonContinentCodes}
            latestValues={comparisonContinentLatest}
            chartData={comparisonContinentChartData}
            unit={indicator.unit}
            color="#14b8a6"
            territoryLabel="continente"
            onAdd={(code) => setComparisonContinentCodes((current) => addToComparison(current, code))}
            onRemove={(code) => setComparisonContinentCodes((current) => removeFromComparison(current, code))}
            tooltipFormatter={tooltipFormatter}
          />
          <TerritoryComparisonPanel
            title="Comparar países"
            description="Selecione de 2 a 5 países do recorte atual para confrontar séries históricas e o último valor disponível."
            territories={filteredCountries}
            selectedCodes={comparisonCountryCodes.filter((code) => filteredCountries.some((country) => country.code === code))}
            latestValues={comparisonCountryLatest}
            chartData={comparisonCountryChartData}
            unit={indicator.unit}
            color="#2563eb"
            territoryLabel="país"
            onAdd={(code) => setComparisonCountryCodes((current) => addToComparison(current, code))}
            onRemove={(code) => setComparisonCountryCodes((current) => removeFromComparison(current, code))}
            tooltipFormatter={tooltipFormatter}
          />
        </>
      ) : effectiveView === 'country' ? (
        <>
          <section className="panel controls controls--country">
            <label>Indicador<select value={indicatorId} onChange={(event) => setSelectedIndicatorId(event.target.value)}>{themeIndicators.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Continente<select value={continent} onChange={(event) => { const nextContinent = event.target.value; const nextCountries = nextContinent === 'Todos' ? data.countries : data.countries.filter((country) => country.continent === nextContinent); setContinent(nextContinent); setCountryCode(nextCountries[0]?.code ?? '') }}><option value="Todos">Mundo inteiro</option>{data.continents.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label>País<select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>{filteredCountries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
          </section>
          <section className="content-grid content-grid--states">
            <article className="panel country-callout"><span>Leitura nacional</span><h3>{countryName}</h3><p>{data.countries.find((country) => country.code === countryCode)?.continent ?? 'Continente não identificado'} • {indicator.name}</p><button className="text-button" onClick={() => setView('world')}>Voltar ao panorama mundial</button></article>
            <article className="panel">
              <div className="panel__header"><div><h3>Evolução de {countryName}</h3><p>{indicator.description}</p></div><strong className="badge">{indicator.latestYear}</strong></div>
              <div className="chart"><ResponsiveContainer width="100%" height={300}><LineChart data={selectedCountrySeries?.points ?? []}><CartesianGrid stroke="#334155" strokeDasharray="4 4" /><XAxis dataKey="year" stroke="#a8b8cc" /><YAxis stroke="#a8b8cc" /><Tooltip formatter={tooltipFormatter(indicator.unit)} /><Line type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div>
              <p className="meta">Fonte: <a href={activeSource?.url}>{activeSource?.name}</a> • Atualização conhecida: {activeSource?.lastUpdated}</p>
            </article>
          </section>
          {countryCode === 'BRA' ? (
            <section className="panel country-next-step"><div><span>Próximo nível disponível</span><h3>Subdivisões brasileiras</h3><p>Compare unidades federativas e, quando houver dados, Regiões Geográficas Imediatas do IBGE.</p></div><div><button className="advance-button" onClick={() => setView('states')} disabled={stateThemeIndicators.length === 0}>Ver estados brasileiros</button><button className="text-button" onClick={() => setView('regions')}>Ir para regiões imediatas</button></div></section>
          ) : (
            <section className="panel country-next-step country-next-step--empty"><div><span>Detalhe territorial</span><h3>Sem série subnacional comparável neste MVP</h3><p>O programa não compara países a estados ou províncias. Novos conectores serão adicionados quando houver fonte pública, licença clara e unidades equivalentes.</p></div></section>
          )}
        </>
      ) : effectiveView === 'states' ? (
        <>
          <section className="panel controls controls--states">
            <label>Estado do Brasil<select value={stateCode} onChange={(event) => setStateCode(event.target.value)}>{data.brazilStates.map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}</select></label>
            <label>Indicador estadual<select value={brazilIndicator.id} onChange={(event) => setStateIndicatorId(event.target.value)}>{stateThemeIndicators.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <p className="controls__context">Indicador estadual selecionado: <strong>{brazilIndicator.name}</strong>. Novas tabelas do IBGE podem ser adicionadas pelo conector de dados.</p>
          </section>
          <section className="content-grid content-grid--states">
            {brazilGeo
              ? <MapPanel title="Mapa dos estados brasileiros" subtitle={`${brazilIndicator.name} • clique para selecionar uma UF`} geography={brazilGeo} valueByCode={brazilValueByCode} codeKeys={['sidra_code', 'iso_3166_2', 'postal']} onSelect={setStateCode} selectedCode={stateCode} formatValue={(value) => formatValue(value, brazilIndicator.unit)} direction={brazilIndicator.direction} />
              : <article className="panel map-loading"><h3>Carregando mapa dos estados</h3><p>{brazilMapError ?? 'O painel principal continua disponível enquanto o mapa detalhado é preparado.'}</p>{brazilMapError && <button className="advance-button" onClick={() => { setBrazilMapError(null); setBrazilMapLoadAttempt((attempt) => attempt + 1) }}>Tentar novamente</button>}</article>}
            <article className="panel">
              <div className="panel__header"><div><h3>{stateName}</h3><p>{brazilIndicator.description}</p></div><strong className="badge">{brazilIndicator.latestYear}</strong></div>
              <div className="chart"><ResponsiveContainer width="100%" height={300}><LineChart data={selectedStateSeries?.points ?? []}><CartesianGrid stroke="#334155" strokeDasharray="4 4" /><XAxis dataKey="year" stroke="#a8b8cc" /><YAxis stroke="#a8b8cc" /><Tooltip formatter={tooltipFormatter(brazilIndicator.unit)} /><Line type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div>
              <p className="meta">Fonte: <a href={activeSource?.url}>{activeSource?.name}</a> • Atualização conhecida: {activeSource?.lastUpdated}</p>
            </article>
          </section>
          <RankingPanel title="Ranking entre estados" description="10 UFs com os maiores valores no indicador estadual disponível." ranking={activeRanking} unit={brazilIndicator.unit} direction={brazilIndicator.direction} color="#b45309" tooltipFormatter={tooltipFormatter} />
          <TerritoryComparisonPanel
            title="Comparar estados"
            description="Selecione de 2 a 5 UFs para comparar a evolução e o valor mais recente do indicador."
            territories={data.brazilStates}
            selectedCodes={comparisonStateCodes}
            latestValues={comparisonLatest}
            chartData={comparisonChartData}
            unit={brazilIndicator.unit}
            color="#f59e0b"
            territoryLabel="estado"
            onAdd={(code) => setComparisonStateCodes((current) => addToComparison(current, code))}
            onRemove={(code) => setComparisonStateCodes((current) => removeFromComparison(current, code))}
            tooltipFormatter={tooltipFormatter}
          />
        </>
      ) : (
        <>
          <section className="panel controls controls--regions">
            <label>Estado do Brasil<select value={stateCode} onChange={(event) => { const nextState = event.target.value; const nextRegions = data.brazilImmediateRegions.filter((region) => region.stateCode === nextState); setStateCode(nextState); setImmediateRegionCode(nextRegions[0]?.code ?? ''); setComparisonImmediateRegionCodes(nextRegions.slice(0, 3).map((region) => region.code)) }}>{data.brazilStates.map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}</select></label>
            <label>Indicador regional<select value={immediateRegionIndicator.id} onChange={(event) => setImmediateIndicatorId(event.target.value)}>{immediateIndicators.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Região Geográfica Imediata<select value={immediateRegionCode} onChange={(event) => setImmediateRegionCode(event.target.value)}>{regionsForState.map((region) => <option key={region.code} value={region.code}>{region.name}</option>)}</select></label>
            <p className="controls__context">Indicador regional: <strong>{immediateRegionIndicator.name}</strong>. Agregação municipal do Censo 2022/SIDRA pela divisão territorial do IBGE.</p>
          </section>
          <section className="content-grid content-grid--states">
            <article className="panel region-callout"><span>UF selecionada</span><h3>{stateName}</h3><p>{regionsForState.length} Regiões Geográficas Imediatas disponíveis para análise.</p></article>
            <article className="panel">
              <div className="panel__header"><div><h3>{selectedImmediateRegion?.name ?? 'Selecione uma região'}</h3><p>{immediateRegionIndicator.description}</p></div><strong className="badge">{immediateRegionIndicator.latestYear}</strong></div>
              <div className="chart"><ResponsiveContainer width="100%" height={300}><LineChart data={selectedImmediateSeries?.points ?? []}><CartesianGrid stroke="#334155" strokeDasharray="4 4" /><XAxis dataKey="year" stroke="#a8b8cc" /><YAxis stroke="#a8b8cc" /><Tooltip formatter={tooltipFormatter(immediateRegionIndicator.unit)} /><Line type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={3} dot /></LineChart></ResponsiveContainer></div>
              <p className="meta">Fonte: <a href={activeSource?.url}>{activeSource?.name}</a> • Atualização conhecida: {activeSource?.lastUpdated}</p>
            </article>
          </section>
          <RankingPanel title="Ranking entre Regiões Imediatas" description="20 regiões brasileiras para o indicador regional do IBGE." ranking={activeRanking} unit={immediateRegionIndicator.unit} direction={immediateRegionIndicator.direction} color="#8b5cf6" tooltipFormatter={tooltipFormatter} />
          <TerritoryComparisonPanel
            title="Comparar regiões imediatas"
            description="Confronte até cinco regiões geográficas imediatas da UF selecionada."
            territories={regionsForState}
            selectedCodes={comparisonImmediateRegionCodes}
            latestValues={comparisonImmediateLatest}
            chartData={comparisonImmediateChartData}
            unit={immediateRegionIndicator.unit}
            color="#8b5cf6"
            territoryLabel="região imediata"
            onAdd={(code) => setComparisonImmediateRegionCodes((current) => addToComparison(current, code))}
            onRemove={(code) => setComparisonImmediateRegionCodes((current) => removeFromComparison(current, code))}
            tooltipFormatter={tooltipFormatter}
          />
        </>
      )}

      <section className="content-grid content-grid--footer">
        <article className="panel"><div className="panel__header"><div><h3>Arquitetura pronta para crescer</h3><p>Coleta, processamento e visualização permanecem separados.</p></div></div><ul className="stack-list"><li><strong>Coleta:</strong> conectores por fonte em `scripts/data`.</li><li><strong>Processamento:</strong> schema único para séries, rankings e metadados.</li><li><strong>Frontend:</strong> dados estáticos em `public/data`, sem dependência direta das APIs.</li></ul></article>
        <article className="panel"><div className="panel__header"><div><h3>Fonte e metodologia da visão</h3><p>Dados e critérios do indicador atualmente selecionado.</p></div></div><div className="source-summary"><strong>{activeSource?.name}</strong><p><a href={activeSource?.url}>fonte</a> • <a href={activeSource?.methodologyUrl}>metodologia</a></p><p>Licença: {activeSource?.license} • Atualização da fonte: {activeSource?.lastUpdated}</p><p className={`indicator-meaning indicator-meaning--${activeIndicator.direction}`}>{directionLabel}</p><p>Cobertura: {activeLatest.length} de {activeCoverageTotal} {activeTerritoryLabel} com último dado disponível. Ano mais recente do indicador: {activeIndicator.latestYear}.</p><p>Arquivo do painel gerado em: {new Date(data.generatedAt).toLocaleString('pt-BR')}.</p></div></article>
      </section>
      <section className="panel source-status">
        <div className="panel__header"><div><h3>Status das fontes</h3><p>Fontes incluídas no último processamento bem-sucedido, em {new Date(data.generatedAt).toLocaleString('pt-BR')}.</p></div><strong className="badge">{data.sources.length} fontes</strong></div>
        <div className="source-status__grid">{data.sources.map((source) => <article key={source.id} className="source-status__item"><span>Incluída</span><strong>{source.name}</strong><p>Referência: {source.lastUpdated}</p><a href={source.url}>Abrir fonte</a></article>)}</div>
      </section>
    </main>
  )
}

type RankingPanelProps = {
  title: string
  description: string
  ranking: DashboardData['latest']
  unit: string
  direction: 'higher-better' | 'higher-worse'
  color: string
  tooltipFormatter: (unit: string) => (value: unknown) => string
}

function RankingPanel({ title, description, ranking, unit, direction, color, tooltipFormatter }: RankingPanelProps) {
  const directionText = direction === 'higher-worse'
    ? 'Neste indicador, valores mais altos sinalizam maior pressão ou vulnerabilidade.'
    : 'Neste indicador, valores mais altos sinalizam maior acesso, proteção ou capacidade.'
  return <section className="panel ranking-panel"><div className="panel__header"><div><h3>{title}</h3><p>{description}</p><p className={`ranking-meaning ranking-meaning--${direction}`}>{directionText}</p></div><button className="export-button" onClick={() => exportRankingCsv(title, ranking, unit)}>Baixar CSV</button></div><div className="chart"><ResponsiveContainer width="100%" height={340}><BarChart data={[...ranking].reverse()}><CartesianGrid stroke="#334155" strokeDasharray="4 4" /><XAxis type="number" stroke="#a8b8cc" /><YAxis type="category" dataKey="geographyName" width={140} stroke="#a8b8cc" /><Tooltip formatter={tooltipFormatter(unit)} /><Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div></section>
}

function exportRankingCsv(title: string, ranking: DashboardData['latest'], unit: string) {
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
  const rows = ['posicao,territorio,valor,unidade']
  ranking.forEach((item, index) => rows.push([index + 1, item.geographyName, item.value, unit].map(escape).join(',')))
  const blob = new Blob([`\ufeff${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' })
  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(blob)
  anchor.download = `${title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}.csv`
  anchor.click()
  URL.revokeObjectURL(anchor.href)
}

type TerritoryComparisonPanelProps = {
  title: string
  description: string
  territories: Array<{ code: string; name: string }>
  selectedCodes: string[]
  latestValues: DashboardData['latest']
  chartData: Array<Record<string, number | string>>
  unit: string
  color: string
  territoryLabel: string
  onAdd: (code: string) => void
  onRemove: (code: string) => void
  tooltipFormatter: (unit: string) => (value: unknown) => string
}

const COMPARISON_COLORS = ['#b45309', '#0f766e', '#2563eb', '#9333ea', '#be123c']

function addToComparison(current: string[], code: string) {
  if (!code || current.includes(code) || current.length >= 5) return current
  return [...current, code]
}

function removeFromComparison(current: string[], code: string) {
  return current.length <= 2 ? current : current.filter((item) => item !== code)
}

function buildComparisonChartData(
  data: DashboardData,
  indicatorId: string,
  territories: Array<{ code: string }>,
) {
  const pointsByCode = new Map(territories.map((territory) => [
    territory.code,
    getSeriesForGeography(data, indicatorId, territory.code)?.points ?? [],
  ]))
  const years = new Set(Array.from(pointsByCode.values()).flatMap((points) => points.map((point) => point.year)))

  return [...years].sort((a, b) => a - b).map((year) => {
    const row: Record<string, number | string> = { year }
    pointsByCode.forEach((points, code) => {
      const point = points.find((item) => item.year === year)
      if (point) row[code] = point.value
    })
    return row
  })
}

function buildContinentLatestValues(data: DashboardData, indicatorId: string): LatestValue[] {
  return data.continents.flatMap((continent) => {
    const countryCodes = new Set(data.countries.filter((country) => country.continent === continent).map((country) => country.code))
    const values = getLatestByIndicator(data, indicatorId, 'country').filter((item) => countryCodes.has(item.geographyCode))
    const weightedAverage = getPopulationWeightedAverage(data, values)
    if (!weightedAverage) return []
    return [{
      indicatorId,
      geographyType: 'country' as const,
      geographyCode: continent,
      geographyName: continent,
      year: Math.max(...values.map((item) => item.year)),
      value: weightedAverage.value,
    }]
  })
}

function buildContinentComparisonChartData(
  data: DashboardData,
  indicatorId: string,
  continents: Array<{ code: string }>,
) {
  const valuesByContinent = new Map<string, Map<number, LatestValue[]>>()
  continents.forEach(({ code: continent }) => {
    const countryCodes = new Set(data.countries.filter((country) => country.continent === continent).map((country) => country.code))
    const valuesByYear = new Map<number, LatestValue[]>()
    data.series.filter((series) => series.indicatorId === indicatorId && countryCodes.has(series.geographyCode)).forEach((series) => {
      series.points.forEach((point) => valuesByYear.set(point.year, [...(valuesByYear.get(point.year) ?? []), {
        indicatorId,
        geographyType: 'country',
        geographyCode: series.geographyCode,
        geographyName: series.geographyName,
        year: point.year,
        value: point.value,
      }]))
    })
    valuesByContinent.set(continent, valuesByYear)
  })
  const years = new Set(Array.from(valuesByContinent.values()).flatMap((values) => [...values.keys()]))

  return [...years].sort((a, b) => a - b).map((year) => {
    const row: Record<string, number | string> = { year }
    valuesByContinent.forEach((values, continent) => {
      const weightedAverage = getPopulationWeightedAverage(data, values.get(year) ?? [])
      if (weightedAverage) row[continent] = weightedAverage.value
    })
    return row
  })
}

function TerritoryComparisonPanel({ title, description, territories, selectedCodes, latestValues, chartData, unit, color, territoryLabel, onAdd, onRemove, tooltipFormatter }: TerritoryComparisonPanelProps) {
  const selectedTerritories = territories.filter((territory) => selectedCodes.includes(territory.code))
  const latestByCode = new Map(latestValues.map((item) => [item.geographyCode, item]))
  const territoriesWithoutData = selectedTerritories.filter((territory) => !latestByCode.has(territory.code))
  return <section className="panel comparison-panel">
    <div className="panel__header"><div><h3>{title}</h3><p>{description}</p></div></div>
    <div className="comparison-controls">
      <select aria-label={`Adicionar ${territoryLabel} à comparação`} defaultValue="" onChange={(event) => { onAdd(event.target.value); event.target.value = '' }}>
        <option value="">Adicionar {territoryLabel}</option>
        {territories.filter((territory) => !selectedCodes.includes(territory.code)).map((territory) => <option key={territory.code} value={territory.code}>{territory.name}</option>)}
      </select>
      <div className="comparison-chips">
        {selectedTerritories.map((territory, index) => <button key={territory.code} className="comparison-chip" style={{ '--chip-color': COMPARISON_COLORS[index] } as CSSProperties} onClick={() => onRemove(territory.code)} title="Remover da comparação">{territory.name} <span>×</span></button>)}
      </div>
    </div>
    {territoriesWithoutData.length > 0 && <p className="comparison-warning">Sem último dado disponível para: {territoriesWithoutData.map((territory) => territory.name).join(', ')}. Esses territórios permanecem selecionados, mas não aparecem nos gráficos.</p>}
    <div className="comparison-grid">
      <div className="chart"><h4>Evolução histórica</h4><ResponsiveContainer width="100%" height={300}><LineChart data={chartData}><CartesianGrid stroke="#334155" strokeDasharray="4 4" /><XAxis dataKey="year" stroke="#a8b8cc" /><YAxis stroke="#a8b8cc" /><Tooltip formatter={tooltipFormatter(unit)} />{selectedTerritories.map((territory, index) => <Line key={territory.code} type="monotone" dataKey={territory.code} name={territory.name} stroke={COMPARISON_COLORS[index]} strokeWidth={3} dot={false} />)}</LineChart></ResponsiveContainer></div>
      <div className="chart"><h4>Último valor disponível</h4><ResponsiveContainer width="100%" height={300}><BarChart data={selectedTerritories.flatMap((territory) => { const latest = latestByCode.get(territory.code); return latest ? [{ name: territory.name, value: latest.value }] : [] })}><CartesianGrid stroke="#334155" strokeDasharray="4 4" /><XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={70} stroke="#a8b8cc" /><YAxis stroke="#a8b8cc" /><Tooltip formatter={tooltipFormatter(unit)} /><Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
    </div>
  </section>
}

export default App
