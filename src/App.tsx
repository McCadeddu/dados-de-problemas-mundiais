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
import { NationalDataPanel } from './components/NationalDataPanel'
import { EducationWorkPanel } from './components/EducationWorkPanel'
import { NarrativeSynthesisPanel } from './components/NarrativeSynthesisPanel'
import { ComparabilityMatrixPanel } from './components/ComparabilityMatrixPanel'
import { DataQualityPanel } from './components/DataQualityPanel'
import { IndicatorExplanation } from './components/IndicatorExplanation'
import { WorkMigrationComparisonPanel } from './components/WorkMigrationComparisonPanel'
import { getThemeIdFromPath, getThemePath } from './lib/themeRoutes'
import {
  formatValue,
  getDefaultIndicator,
  getIndicator,
  getIndicatorsByTheme,
  getLatestByIndicator,
  getPopulationWeightedAverage,
  getRanking,
  getSafeThemeId,
  getSeriesForGeography,
  getTopRanked,
} from './lib/dashboard'
import type { DashboardData, LatestValue, MigrationFlow, Series } from './types'

type GeoJson = GeoJSON.FeatureCollection
type ViewMode = 'landing' | 'world' | 'country' | 'states' | 'regions'

const THEME_MAP_COLORS: Record<string, string[]> = {
  'hunger-water': ['#dcfce7', '#86efac', '#4ade80', '#16a34a', '#166534'],
  'gender-equality': ['#fce7f3', '#f9a8d4', '#f472b6', '#db2777', '#9d174d'],
  'poverty-inequality': ['#fef3c7', '#fde68a', '#fbbf24', '#d97706', '#92400e'],
  'climate-vulnerability': ['#e0f2fe', '#7dd3fc', '#38bdf8', '#0284c7', '#075985'],
  'forced-migration': ['#ede9fe', '#c4b5fd', '#a78bfa', '#7c3aed', '#5b21b6'],
  illiteracy: ['#ffedd5', '#fdba74', '#fb923c', '#ea580c', '#9a3412'],
  'decent-work': ['#ccfbf1', '#5eead4', '#2dd4bf', '#0d9488', '#0f766e'],
}

const initialParams = new URLSearchParams(window.location.search)

function initialView(): ViewMode {
  const value = initialParams.get('visao')
  if (value === 'country' || value === 'states' || value === 'regions' || value === 'world') return value
  return getThemeIdFromPath(window.location.pathname) ? 'world' : 'landing'
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
  const [seriesLoadError, setSeriesLoadError] = useState<string | null>(null)
  const [migrationFlows, setMigrationFlows] = useState<MigrationFlow[] | null>(null)
  const [migrationFlowsError, setMigrationFlowsError] = useState<string | null>(null)
  const [adaptCsvPreview, setAdaptCsvPreview] = useState<{ name: string; headers: string[]; rows: number; sample: string[]; missing: string[] } | null>(null)
  const [worldGeo, setWorldGeo] = useState<GeoJson | null>(null)
  const [brazilGeo, setBrazilGeo] = useState<GeoJson | null>(null)
  const [brazilMapError, setBrazilMapError] = useState<string | null>(null)
  const [brazilMapLoadAttempt, setBrazilMapLoadAttempt] = useState(0)
  const [view, setView] = useState<ViewMode>(initialView)
  const [themeId, setThemeId] = useState(() => getThemeIdFromPath(window.location.pathname) ?? initialValue('tema', 'hunger-water'))
  const [selectedIndicatorId, setSelectedIndicatorId] = useState(() => initialValue('indicador', ''))
  const [continent, setContinent] = useState(() => initialValue('continente', 'Todos'))
  const [countryCode, setCountryCode] = useState(() => initialValue('pais', 'BRA'))
  const [countryQuery, setCountryQuery] = useState('')
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
    const path = view === 'landing'
      ? import.meta.env.BASE_URL
      : `${getThemePath(data ? getSafeThemeId(data, themeId) : 'hunger-water')}?${params.toString()}`
    window.history.replaceState(null, '', path)
  }, [activeThemeId, comparisonContinentCodes, comparisonCountryCodes, comparisonImmediateRegionCodes, comparisonStateCodes, continent, countryCode, data, immediateIndicatorId, immediateRegionCode, selectedIndicatorId, stateCode, stateIndicatorId, themeId, view])

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      window.prompt('Copie o link desta análise:', window.location.href)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const previewAdaptCsv = async (file: File | undefined) => {
    if (!file) return
    const lines = (await file.text()).split(/\r?\n/).filter(Boolean)
    const separator = lines[0]?.includes(';') ? ';' : ','
    const headers = (lines[0] ?? '').split(separator).map((value) => value.trim())
    const normalizedHeaders = headers.map((header) => header.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    const checks: Array<[string, RegExp]> = [
      ['UF ou estado', /\b(uf|estado|sigla_uf)\b/],
      ['município ou código IBGE', /(municip|codigo.*ibge|cod.*mun)/],
      ['valor do indicador', /(valor|indice|risco|vulnerab|exposicao)/],
    ]
    const missing = checks.flatMap(([label, pattern]) => normalizedHeaders.some((header) => pattern.test(header)) ? [] : [label])
    setAdaptCsvPreview({
      name: file.name,
      headers,
      rows: Math.max(lines.length - 1, 0),
      sample: lines.slice(1, 4),
      missing,
    })
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
  const immediateIndicators = data?.indicators.filter(
    (item) => item.geographyType === 'brazil-immediate-region',
  ) ?? []
  const regionalThemeIndicators = immediateIndicators.filter((item) => item.themeId === activeThemeId)
  const effectiveView = (view === 'states' && stateThemeIndicators.length === 0)
    || (view === 'regions' && regionalThemeIndicators.length === 0)
    ? 'world'
    : view
  const regionalSanitationIndicators = regionalThemeIndicators.filter((item) => item.themeId === 'hunger-water')
  const immediateRegionIndicator = regionalThemeIndicators.find((item) => item.id === immediateIndicatorId)
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
  const themeGlobalSnapshot = data ? themeIndicators.flatMap((item) => {
    const latest = getLatestByIndicator(data, item.id, 'country')
    const average = getPopulationWeightedAverage(data, latest)
    if (!average || latest.length === 0) return []
    return [{ indicator: item, value: average.value, year: average.firstYear === average.lastYear ? String(average.lastYear) : String(average.firstYear) + '–' + String(average.lastYear), coverage: average.coverage }]
  }) : []

  const worldValueByCode = new Map(countryLatest.map((item) => [
    item.geographyCode,
    { name: item.geographyName, value: item.value },
  ]))
  const brazilValueByCode = new Map(brazilLatest.map((item) => [
    item.geographyCode,
    { name: item.geographyName, value: item.value },
  ]))
  const requiredIndicatorId = effectiveView === 'world' || effectiveView === 'country'
    ? indicator?.id
    : effectiveView === 'states'
      ? brazilIndicator?.id
      : immediateRegionIndicator?.id

  useEffect(() => {
    if (!data || !requiredIndicatorId) return
    const comparisonIds = activeThemeId === 'decent-work' || activeThemeId === 'forced-migration'
      ? ['ilo-unemployment', 'ilo-vulnerable-employment', 'unhcr-refugees-hosted', 'unhcr-asylum-seekers-hosted', 'wb-migrant-stock']
      : []
    const requiredIds = [...new Set([requiredIndicatorId, ...comparisonIds])]
    const missingIds = requiredIds.filter((id) => !data.series.some((entry) => entry.indicatorId === id))
    const needsPopulation = effectiveView === 'world'
    if (missingIds.length === 0 && (!needsPopulation || data.countryPopulation.length > 0)) return

    let cancelled = false
    const dataBaseUrl = import.meta.env.BASE_URL
    const requests: Array<Promise<Series[]>> = missingIds.map((id) => fetch(`${dataBaseUrl}data/series/${id}.json`).then((response) => {
      if (!response.ok) throw new Error('Série indisponível')
      return response.json() as Promise<Series[]>
    }))
    const populationRequest = needsPopulation && data.countryPopulation.length === 0
      ? fetch(`${dataBaseUrl}data/series/country-population.json`).then((response) => {
        if (!response.ok) throw new Error('População indisponível')
        return response.json() as Promise<DashboardData['countryPopulation']>
      })
      : Promise.resolve(null)

    Promise.all([Promise.all(requests), populationRequest]).then(([seriesResponses, countryPopulation]) => {
      if (cancelled) return
      setData((current) => current ? {
        ...current,
        series: seriesResponses.length ? [...current.series, ...seriesResponses.flat()] : current.series,
        countryPopulation: countryPopulation ?? current.countryPopulation,
      } : current)
      setSeriesLoadError(null)
    }).catch(() => {
      if (!cancelled) setSeriesLoadError('Não foi possível carregar a série histórica desta visualização.')
    })
    return () => { cancelled = true }
  }, [activeThemeId, data, effectiveView, requiredIndicatorId])

  useEffect(() => {
    if (!data || activeThemeId !== 'forced-migration' || migrationFlows) return
    fetch(`${import.meta.env.BASE_URL}data/flows/unhcr-refugee-flows.json`)
      .then((response) => {
        if (!response.ok) throw new Error('Fluxos indisponíveis')
        return response.json() as Promise<MigrationFlow[]>
      })
      .then((flows) => { setMigrationFlows(flows); setMigrationFlowsError(null) })
      .catch(() => setMigrationFlowsError('Não foi possível carregar os corredores de refúgio.'))
  }, [activeThemeId, data, migrationFlows])

  if (loadError) {
    return <main className="shell load-error"><h1>Falha ao abrir o painel</h1><p>{loadError}</p><button className="advance-button" onClick={() => { setLoadError(null); setLoadAttempt((attempt) => attempt + 1) }}>Tentar novamente</button></main>
  }
  if (!data || !worldGeo || !indicator || !brazilIndicator || !immediateRegionIndicator) {
    return <main className="shell"><p>Carregando painel e séries...</p></main>
  }

  if (view === 'landing') {
    return (
      <main className="shell landing-shell">
        <section className="landing" aria-labelledby="landing-title">
          <span className="eyebrow">Mundialidade</span>
          <h1 id="landing-title">Qual problemática você quer analisar?</h1>
          <p>Escolha um tema para abrir seu panorama mundial.</p>
          <div className="landing__themes" aria-label="Problemáticas disponíveis">
            {data.themes.map((theme) => (
              <button key={theme.id} className={`landing-theme--${theme.id}`} onClick={() => { setThemeId(theme.id); setSelectedIndicatorId(''); setView('world') }}>
                <strong>{theme.name}</strong>
                <span>{theme.description}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    )
  }

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
  const activeSeriesLoading = !data.series.some((entry) => entry.indicatorId === activeIndicator.id)
    || ((effectiveView === 'world' || effectiveView === 'country') && data.countryPopulation.length === 0)
  const directionLabel = activeIndicator.direction === 'neutral'
    ? 'Valores maiores indicam maior volume de registros; a interpretação depende do contexto.'
    : activeIndicator.direction === 'higher-worse'
      ? 'Valores maiores indicam maior pressão ou vulnerabilidade.'
      : 'Valores maiores indicam maior acesso, proteção ou capacidade.'
  const activeRanking = getTopRanked(data, activeIndicator.id, 10)
  const filteredCountries = continent === 'Todos'
    ? data.countries
    : data.countries.filter((country) => country.continent === continent)
  const countryMatches = filteredCountries.filter((country) => country.name.toLocaleLowerCase('pt-BR').includes(countryQuery.toLocaleLowerCase('pt-BR')))
  const countryChoiceOptions = countryMatches.some((country) => country.code === countryCode)
    ? countryMatches
    : [
      ...filteredCountries.filter((country) => country.code === countryCode),
      ...countryMatches,
    ]
  const worldRanking = (getRanking(data, indicator.id)?.items ?? []).filter((item) => {
    const country = data.countries.find((candidate) => candidate.code === item.geographyCode)
    return continent === 'Todos' || country?.continent === continent
  }).slice(0, 10)
  const globalRanking = getRanking(data, indicator.id)?.items ?? []
  const countryGlobalRank = globalRanking.findIndex((item) => item.geographyCode === countryCode) + 1
  const continentValues = countryLatest.filter((item) => {
    const country = data.countries.find((candidate) => candidate.code === item.geographyCode)
    return continent === 'Todos' || country?.continent === continent
  })
  const supportsPopulationAverage = activeThemeId !== 'illiteracy' && activeThemeId !== 'decent-work'
  const continentAverage = supportsPopulationAverage ? getPopulationWeightedAverage(data, continentValues) : null
  const regionsForState = data.brazilImmediateRegions.filter((region) => region.stateCode === stateCode)
  const selectedImmediateRegion = data.brazilImmediateRegions.find(
    (region) => region.code === immediateRegionCode)
  const selectedImmediateSeries = getSeriesForGeography(
    data,
    immediateRegionIndicator.id,
    immediateRegionCode,
  )
  const selectedRegionalSanitation = regionalSanitationIndicators.flatMap((item) => {
    const latest = getLatestByIndicator(data, item.id, 'brazil-immediate-region').find(
      (entry) => entry.geographyCode === immediateRegionCode,
    )
    return latest ? [{ indicator: item, value: latest.value, year: latest.year }] : []
  })
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
    <main className={`shell theme-shell theme-shell--${activeThemeId}`}>
      <header className="analysis-header">
        <div>
          <button className="text-button" onClick={() => setView('landing')}>Escolher outra problemática</button>
          <p><strong>{data.themes.find((theme) => theme.id === activeThemeId)?.name}</strong> · análise territorial progressiva</p>
        </div>
        <div className="analysis-header__actions">
          {worldPopulation !== null && <span className="population-chip" title="Estimativa calculada a partir da variação anual mais recente do World Bank">População mundial estimada: {worldPopulation.toLocaleString('pt-BR')}</span>}
          <button className="share-button" onClick={() => void copyShareLink()}>{copied ? 'Link copiado' : 'Copiar link desta análise'}</button>
        </div>
      </header>
      <nav className="view-switcher" aria-label="Escala de análise">
        <button className={effectiveView === 'world' ? 'is-active' : ''} onClick={() => setView('world')}>
          1. Mundo
          <span>Panorama, continentes e comparação entre países</span>
        </button>
        <button className={view === 'country' ? 'is-active' : ''} onClick={() => setView('country')}>
          2. País escolhido
          <span>{countryName}: dados nacionais e subdivisões disponíveis</span>
        </button>
        <button className={effectiveView === 'states' ? 'is-active' : ''} onClick={() => setView('states')} disabled={stateThemeIndicators.length === 0} title={stateThemeIndicators.length === 0 ? 'Ainda não há indicador estadual para esta problemática.' : undefined}>
          3. Brasil: estados federados
          <span>Comparar unidades federativas brasileiras</span>
        </button>
        <button className={view === 'regions' ? 'is-active' : ''} onClick={() => setView('regions')} disabled={regionalThemeIndicators.length === 0} title={regionalThemeIndicators.length === 0 ? 'Ainda não há indicador regional para esta problemática.' : undefined}>
          4. Regiões IBGE
          <span>Comparar Regiões Geográficas Imediatas</span>
        </button>
      </nav>

      <p className="hierarchy" aria-label="Caminho de análise">
        Problemática: <strong>{data.themes.find((theme) => theme.id === activeThemeId)?.name}</strong>
        <span>›</span> {effectiveView === 'world' ? 'Mundo' : effectiveView === 'country' ? `Mundo › ${countryName}` : effectiveView === 'states' ? 'Brasil › Estados' : `Brasil › ${stateName} › Regiões Imediatas`}
      </p>
      {activeSeriesLoading && <p className="series-loading" role="status">Carregando série histórica e comparações para esta visualização...</p>}
      {seriesLoadError && <p className="comparison-warning" role="alert">{seriesLoadError}</p>}

      {effectiveView === 'world' ? (
        <>
          <section className="panel controls controls--world">
            <label>Indicador<select value={indicatorId} onChange={(event) => setSelectedIndicatorId(event.target.value)}>{themeIndicators.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Continente<select value={continent} onChange={(event) => { const nextContinent = event.target.value; const nextCountries = nextContinent === 'Todos' ? data.countries : data.countries.filter((country) => country.continent === nextContinent); setContinent(nextContinent); setCountryQuery(''); setCountryCode(nextCountries[0]?.code ?? ''); setComparisonCountryCodes(nextCountries.slice(0, 3).map((country) => country.code)) }}><option value="Todos">Mundo inteiro</option>{data.continents.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          </section>
          <IndicatorExplanation indicator={activeIndicator} source={activeSource} />
          {activeThemeId === 'hunger-water' && <HungerWaterPanel values={themeGlobalSnapshot} />}
          {activeThemeId === 'gender-equality' && <GenderPanel values={themeGlobalSnapshot} />}
          {activeThemeId === 'poverty-inequality' && <PovertyPanel values={themeGlobalSnapshot} />}
          {activeThemeId === 'climate-vulnerability' && <ClimatePanel values={themeGlobalSnapshot} />}
          <EducationWorkPanel themeId={activeThemeId} />
          <NarrativeSynthesisPanel themeId={activeThemeId} />
          {(activeThemeId === 'decent-work' || activeThemeId === 'forced-migration') && <ComparabilityMatrixPanel />}
          {(activeThemeId === 'decent-work' || activeThemeId === 'forced-migration') && <WorkMigrationComparisonPanel data={data} continent={continent} loadError={seriesLoadError} />}
          <GlobalInsightPanel indicator={indicator} continent={continent} average={continentAverage} coverage={countryLatest.length} leadingValue={worldRanking[0]} />
          {activeThemeId === 'forced-migration' && <MigrationFlowsPanel flows={migrationFlows} error={migrationFlowsError} />}

          <section className="content-grid content-grid--world">
            <MapPanel title="Mapa mundial" subtitle={`${indicator.name} • clique para destacar um país e escolhê-lo no fim da página`} geography={worldGeo} valueByCode={worldValueByCode} codeKeys={['ADM0_A3', 'ISO_A3', 'SOV_A3', 'gu_a3']} onSelect={(code) => { setCountryCode(code); setCountryQuery('') }} selectedCode={countryCode} formatValue={(value) => formatValue(value, indicator.unit)} direction={indicator.direction} projectionKind="peters" colors={THEME_MAP_COLORS[activeThemeId]} selectedColor="var(--theme-accent)" />
            <article className="panel">
              <div className="panel__header"><div><h3>{continent === 'Todos' ? 'Panorama mundial' : `Panorama: ${continent}`}</h3><p>{indicator.description}</p>{continentAverage && <p className="context-metric">Média do recorte, ponderada pela população: {formatValue(continentAverage.value, indicator.unit)} ({continentAverage.coverage} países)</p>}</div><strong className="badge">{indicator.latestYear}</strong></div>
              <div className="world-summary"><strong>{countryLatest.length}</strong><span>países com último dado disponível</span><p>Use o mapa, o ranking e as comparações disponíveis para observar diferenças antes de escolher um país.</p></div>
              <p className="meta">Fonte: <a href={activeSource?.url}>{activeSource?.name}</a> • Atualização conhecida: {activeSource?.lastUpdated}</p>
            </article>
          </section>
          <RankingPanel title={continent === 'Todos' ? 'Ranking global' : `Ranking: ${continent}`} description="10 países com os maiores valores para o indicador e recorte selecionados." ranking={worldRanking} unit={indicator.unit} direction={indicator.direction} color="#2563eb" tooltipFormatter={tooltipFormatter} />
          {supportsPopulationAverage && <TerritoryComparisonPanel
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
          />}
          <TerritoryComparisonPanel
            sectionId="comparar-paises"
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
          <section className="panel world-next-step" aria-label="Escolher país depois da análise mundial">
            <div><span>Próximo passo</span><h3>Escolha um país para detalhar</h3><p>Você concluiu a leitura mundial. Agora pode abrir os dados de um Estado soberano/país e, quando houver cobertura, suas subdivisões.</p></div>
            <div className="world-next-step__actions"><label>Pesquisar país<input value={countryQuery} onChange={(event) => setCountryQuery(event.target.value)} placeholder="Digite um nome" /></label><label>Estado soberano / país<select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>{countryChoiceOptions.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label><button className="advance-button" onClick={() => setView('country')}>Abrir {countryName}</button></div>
          </section>
        </>
      ) : effectiveView === 'country' ? (
        <>
          <section className="panel controls controls--country">
            <label>Indicador<select value={indicatorId} onChange={(event) => setSelectedIndicatorId(event.target.value)}>{themeIndicators.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Continente<select value={continent} onChange={(event) => { const nextContinent = event.target.value; const nextCountries = nextContinent === 'Todos' ? data.countries : data.countries.filter((country) => country.continent === nextContinent); setContinent(nextContinent); setCountryCode(nextCountries[0]?.code ?? '') }}><option value="Todos">Mundo inteiro</option>{data.continents.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label>Estado soberano / país<select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>{filteredCountries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
          </section>
          <IndicatorExplanation indicator={activeIndicator} source={activeSource} />
          <section className="content-grid content-grid--states">
            <article className="panel country-callout"><span>Análise do país</span><h3>{countryName}</h3><p>{data.countries.find((country) => country.code === countryCode)?.continent ?? 'Continente não identificado'} • {indicator.name}</p>{countryGlobalRank > 0 && <p className="country-callout__rank">Posição por valor no recorte mundial: {countryGlobalRank} de {globalRanking.length} países com dados.</p>}<button className="text-button" onClick={() => { if (countryCode === 'BRA') { setContinent('Todos'); setComparisonCountryCodes((current) => ['BRA', ...current.filter((code) => code !== 'BRA')].slice(0, 5)) }; setView('world') }}>{countryCode === 'BRA' ? 'Comparar Brasil com outros países' : 'Voltar ao panorama mundial'}</button></article>
            <article className="panel">
              <div className="panel__header"><div><h3>Evolução de {countryName}</h3><p>{indicator.description}</p></div><strong className="badge">{indicator.latestYear}</strong></div>
              <div className="chart"><ResponsiveContainer width="100%" height={300}><LineChart data={selectedCountrySeries?.points ?? []}><CartesianGrid stroke="#334155" strokeDasharray="4 4" /><XAxis dataKey="year" stroke="#a8b8cc" /><YAxis stroke="#a8b8cc" /><Tooltip formatter={tooltipFormatter(indicator.unit)} /><Line type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div>
              <p className="meta">Fonte: <a href={activeSource?.url}>{activeSource?.name}</a> • Atualização conhecida: {activeSource?.lastUpdated}</p>
            </article>
          </section>
          <NationalDataPanel countryCode={countryCode} themeId={activeThemeId} dashboard={data} />
          {countryCode === 'BRA' && activeThemeId === 'hunger-water' && stateThemeIndicators.some((item) => item.id === 'ibge-state-food-insecurity') && <section className="panel country-next-step"><div><h3>Insegurança alimentar por estado</h3><p>Explore os percentuais de domicílios com alguma insegurança alimentar, moderada ou grave nas 27 UFs, pela PNAD Contínua.</p></div><button className="advance-button" onClick={() => { setStateIndicatorId('ibge-state-food-insecurity'); setView('states') }}>Ver insegurança alimentar por UF</button></section>}
          {countryCode === 'BRA' ? (
            <section className="panel country-next-step"><div><span>Próximo nível disponível</span><h3>Subdivisões do Brasil</h3><p>Compare estados federados e, quando houver dados compatíveis com a problemática, Regiões Geográficas Imediatas do IBGE.</p></div><div><button className="advance-button" onClick={() => setView('states')} disabled={stateThemeIndicators.length === 0}>Ver estados federados</button><button className="text-button" onClick={() => setView('regions')} disabled={regionalThemeIndicators.length === 0}>Ver regiões imediatas</button></div></section>
          ) : (
            <section className="panel country-next-step country-next-step--empty"><div><span>Detalhe territorial</span><h3>Sem subdivisões comparáveis neste país por enquanto</h3><p>O programa só abre estados, províncias ou regiões quando houver fonte pública, licença clara e unidades equivalentes. O Brasil é o primeiro recorte subnacional disponível.</p></div></section>
          )}
        </>
      ) : effectiveView === 'states' ? (
        <>
          <section className="panel controls controls--states">
            <label>Estado do Brasil<select value={stateCode} onChange={(event) => setStateCode(event.target.value)}>{data.brazilStates.map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}</select></label>
            <label>Indicador estadual<select value={brazilIndicator.id} onChange={(event) => setStateIndicatorId(event.target.value)}>{stateThemeIndicators.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <p className="controls__context">Indicador estadual selecionado: <strong>{brazilIndicator.name}</strong>. Novas tabelas do IBGE podem ser adicionadas pelo conector de dados.</p>
          </section>
          {brazilIndicator.id.startsWith('ibge-state-food-insecurity') && <section className="panel"><h3>Como ler a insegurança alimentar estadual</h3><p>Percentual de domicílios, urbanos e rurais, representados pela PNAD Contínua. Alguma insegurança inclui os níveis leve, moderado e grave; não some o total às suas partes. São estimativas amostrais: a posição no ranking não demonstra diferença estatisticamente significativa entre estados.</p><p>O histórico estadual começa em 2023. Não há recorte de insegurança alimentar por Região Geográfica Imediata neste painel; água e saneamento medem outras dimensões.</p><p className="meta"><a href={`${import.meta.env.BASE_URL}data/brazil-food-security-states.json`} download>Baixar séries estaduais e proveniência (JSON)</a> · <a href="https://sidra.ibge.gov.br/tabela/9552">Consultar estimativas e coeficientes de variação no IBGE</a></p></section>}
          <IndicatorExplanation indicator={activeIndicator} source={activeSource} />
          {activeThemeId === 'climate-vulnerability' && <section className="panel source-link-panel"><div><h3>Dados climáticos complementares para o Brasil</h3><p>Como usar: 1. abra o catálogo oficial; 2. baixe um arquivo CSV; 3. selecione-o abaixo; 4. confira as colunas e os avisos; 5. envie o arquivo validado para integração por estado.</p></div><div><a className="advance-button" href="https://www.gov.br/mcti/pt-br/acesso-a-informacao/dados-abertos/dados-abertos/arquivos/adapta-brasil/adaptabrasil" target="_blank" rel="noreferrer">Baixar CSV do AdaptaBrasil</a><label className="csv-upload">Carregar CSV para pré-visualizar<input type="file" accept=".csv,text/csv" onChange={(event) => void previewAdaptCsv(event.target.files?.[0])} /></label></div>{adaptCsvPreview && <div className="csv-preview"><strong>{adaptCsvPreview.name}</strong><p>{adaptCsvPreview.rows.toLocaleString('pt-BR')} linhas de dados. Colunas: {adaptCsvPreview.headers.join(' | ')}</p><p>{adaptCsvPreview.missing.length ? `Atenção: não identifiquei ${adaptCsvPreview.missing.join(', ')}.` : 'Estrutura territorial básica identificada para avaliação.'}</p><code>{adaptCsvPreview.sample.join('\n')}</code></div>}</section>}
          {brazilIndicator.id === 'sismigra-state-active-immigrants' && <section className="panel migration-context"><strong>Como interpretar</strong><p>Este mapa soma registros ativos de imigrantes por UF no SISMIGRA/Polícia Federal. Ele não estima todos os migrantes residentes, refugiados, solicitantes de asilo ou pessoas deslocadas à força.</p></section>}
          <section className="content-grid content-grid--states">
            {brazilGeo
              ? <MapPanel title="Mapa dos estados brasileiros" subtitle={`${brazilIndicator.name} • clique para selecionar uma UF`} geography={brazilGeo} valueByCode={brazilValueByCode} codeKeys={['sidra_code', 'iso_3166_2', 'postal']} onSelect={setStateCode} selectedCode={stateCode} formatValue={(value) => formatValue(value, brazilIndicator.unit)} direction={brazilIndicator.direction} colors={THEME_MAP_COLORS[activeThemeId]} selectedColor="var(--theme-accent)" />
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
            <label>Indicador regional<select value={immediateRegionIndicator.id} onChange={(event) => setImmediateIndicatorId(event.target.value)}>{regionalThemeIndicators.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Região Geográfica Imediata<select value={immediateRegionCode} onChange={(event) => setImmediateRegionCode(event.target.value)}>{regionsForState.map((region) => <option key={region.code} value={region.code}>{region.name}</option>)}</select></label>
            <p className="controls__context">Indicador regional: <strong>{immediateRegionIndicator.name}</strong>. Agregação municipal do Censo 2022/SIDRA pela divisão territorial do IBGE.</p>
          </section>
          <IndicatorExplanation indicator={activeIndicator} source={activeSource} />
          <section className="content-grid content-grid--states">
            <article className="panel region-callout"><span>UF selecionada</span><h3>{stateName}</h3><p>{regionsForState.length} Regiões Geográficas Imediatas disponíveis para análise.</p></article>
            <article className="panel">
              <div className="panel__header"><div><h3>{selectedImmediateRegion?.name ?? 'Selecione uma região'}</h3><p>{immediateRegionIndicator.description}</p></div><strong className="badge">{immediateRegionIndicator.latestYear}</strong></div>
              <div className="chart"><ResponsiveContainer width="100%" height={300}><LineChart data={selectedImmediateSeries?.points ?? []}><CartesianGrid stroke="#334155" strokeDasharray="4 4" /><XAxis dataKey="year" stroke="#a8b8cc" /><YAxis stroke="#a8b8cc" /><Tooltip formatter={tooltipFormatter(immediateRegionIndicator.unit)} /><Line type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={3} dot /></LineChart></ResponsiveContainer></div>
              <p className="meta">Fonte: <a href={activeSource?.url}>{activeSource?.name}</a> • Atualização conhecida: {activeSource?.lastUpdated}</p>
            </article>
          </section>
          <section className="panel regional-snapshot"><div className="panel__header"><div><h3>Saneamento na região selecionada</h3><p>Leitura conjunta de água, esgotamento e coleta de lixo para {selectedImmediateRegion?.name ?? 'a região escolhida'}.</p></div><strong className="badge">Censo 2022</strong></div><div className="regional-snapshot__grid">{selectedRegionalSanitation.map(({ indicator: item, value, year }) => <article key={item.id}><span>{item.name}</span><strong>{formatValue(value, item.unit)}</strong><small>{year} • maior é melhor</small></article>)}</div></section>
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
        <DataQualityPanel indicator={activeIndicator} source={activeSource} latest={activeLatest} coverageTotal={activeCoverageTotal} territoryLabel={activeTerritoryLabel} generatedAt={data.generatedAt} />
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
  direction: 'higher-better' | 'higher-worse' | 'neutral'
  color: string
  tooltipFormatter: (unit: string) => (value: unknown) => string
}

function MigrationFlowsPanel({ flows, error }: { flows: MigrationFlow[] | null; error: string | null }) {
  return <section className="panel migration-flows">
    <div className="panel__header"><div><h3>Principais corredores de refúgio</h3><p>Origem → país de acolhimento, segundo o estoque de pessoas refugiadas no fim de 2025.</p></div><strong className="badge">UNHCR</strong></div>
    {error && <p className="comparison-warning">{error}</p>}
    {!flows && !error && <p className="series-loading" role="status">Carregando corredores de refúgio...</p>}
    {flows && <ol className="migration-flows__list">{flows.slice(0, 12).map((flow) => <li key={`${flow.originCode}-${flow.asylumCode}`}><span>{flow.originName} <b>→</b> {flow.asylumName}</span><strong>{formatValue(flow.value, 'pessoas')}</strong></li>)}</ol>}
    <p className="meta">Os valores representam pessoas refugiadas ou em situação semelhante registradas no país de acolhimento no final do ano. Não equivalem ao número de viagens realizadas naquele ano.</p>
  </section>
}

type GlobalThemeValue = { indicator: DashboardData['indicators'][number]; value: number; year: string; coverage: number }

function HungerWaterPanel({ values }: { values: GlobalThemeValue[] }) {
  return <section className="panel hunger-water-panel">
    <div className="panel__header"><div><h3>Alimento e água no mundo</h3><p>Médias ponderadas pela população nos países com dados disponíveis; não representam a situação de um país específico.</p></div><strong className="badge">Visão global</strong></div>
    {values.length > 0 ? <div className="hunger-water-panel__grid">{values.map(({ indicator, value, year, coverage }) => <article key={indicator.id}><span>{indicator.name}</span><strong>{formatValue(value, indicator.unit)}</strong><small>{year} · {coverage} países · {indicator.direction === 'higher-worse' ? 'maior pressão' : 'maior acesso'}</small></article>)}</div> : <p className="comparison-warning">Carregando população para calcular as médias mundiais.</p>}
  </section>
}

function GenderPanel({ values }: { values: GlobalThemeValue[] }) {
  return <section className="panel gender-panel">
    <div className="panel__header"><div><h3>Igualdade de gênero no mundo</h3><p>Médias ponderadas pela população para contextualizar representação, trabalho, violência e cuidado, sem combinar unidades distintas.</p></div><strong className="badge">Visão global</strong></div>
    {values.length > 0 ? <div className="gender-panel__grid">{values.map(({ indicator, value, year, coverage }) => <article key={indicator.id} className={indicator.direction === 'higher-worse' ? 'is-pressure' : 'is-access'}><span>{indicator.name}</span><strong>{formatValue(value, indicator.unit)}</strong><small>{year} · {coverage} países · {indicator.direction === 'higher-worse' ? 'lacuna ou violência' : 'participação ou representação'}</small></article>)}</div> : <p className="comparison-warning">Carregando população para calcular as médias mundiais.</p>}
  </section>
}

function PovertyPanel({ values }: { values: GlobalThemeValue[] }) {
  return <section className="panel poverty-panel">
    <div className="panel__header"><div><h3>Pobreza e desigualdade no mundo</h3><p>Médias ponderadas pela população para duas dimensões complementares: privação monetária e concentração de renda.</p></div><strong className="badge">Visão global</strong></div>
    {values.length > 0 ? <div className="poverty-panel__grid">{values.map(({ indicator, value, year, coverage }) => <article key={indicator.id}><span>{indicator.name}</span><strong>{formatValue(value, indicator.unit)}</strong><small>{year} · {coverage} países · {indicator.id === 'wb-gini' ? 'maior concentração de renda' : 'população abaixo da linha internacional'}</small></article>)}</div> : <p className="comparison-warning">Carregando população para calcular as médias mundiais.</p>}
  </section>
}

function ClimatePanel({ values }: { values: GlobalThemeValue[] }) {
  return <section className="panel climate-panel">
    <div className="panel__header"><div><h3>Vulnerabilidade climática no mundo</h3><p>Médias ponderadas pela população dos componentes ND-GAIN: exposição e sensibilidade, capacidade de adaptação e prontidão para responder.</p></div><strong className="badge">Visão global</strong></div>
    {values.length > 0 ? <div className="climate-panel__grid">{values.map(({ indicator, value, year, coverage }) => <article key={indicator.id} className={indicator.direction === 'higher-worse' ? 'is-risk' : 'is-readiness'}><span>{indicator.name}</span><strong>{formatValue(value, indicator.unit)}</strong><small>{year} · {coverage} países · {indicator.direction === 'higher-worse' ? 'maior risco' : 'maior capacidade'}</small></article>)}</div> : <p className="comparison-warning">Carregando população para calcular as médias mundiais.</p>}
  </section>
}

function GlobalInsightPanel({ indicator, continent, average, coverage, leadingValue }: {
  indicator: DashboardData['indicators'][number]
  continent: string
  average: { value: number; coverage: number } | null
  coverage: number
  leadingValue?: DashboardData['latest'][number]
}) {
  const scope = continent === 'Todos' ? 'mundo' : continent
  const meaning = indicator.direction === 'neutral'
    ? 'maior volume de registros, cuja interpretação depende do contexto'
    : indicator.direction === 'higher-worse'
      ? 'maior pressão ou vulnerabilidade'
      : 'maior acesso, proteção ou capacidade'
  const themeFocus: Record<string, string> = {
    'hunger-water': 'Observe conjuntamente alimentação e água: um único indicador não descreve toda a segurança alimentar.',
    'gender-equality': 'Compare representação, trabalho, violência e cuidado separadamente: as medidas não devem ser somadas.',
    'poverty-inequality': 'Pobreza e desigualdade são complementares: redução de uma não implica redução automática da outra.',
    'climate-vulnerability': 'Risco e prontidão apontam dimensões diferentes da adaptação climática; leia os dois componentes juntos.',
    'forced-migration': 'Os totais descrevem populações registradas; os corredores de refúgio complementam a leitura de origem e acolhimento.',
    illiteracy: 'As faixas de 15+ e de 15–24 anos têm denominadores diferentes. Não some as taxas nem confunda alfabetização básica com aprendizagem funcional.',
    'decent-work': 'Desemprego usa a força de trabalho como denominador. Ausência de contribuição, informalidade e trabalho forçado são fenômenos distintos.',
  }
  return <section className="panel global-insight" aria-live="polite">
    <div className="panel__header"><div><span>Assistente de leitura</span><h3>O que os dados mostram agora</h3></div><strong className="badge">Atualiza com os filtros</strong></div>
    <p>No recorte <strong>{scope}</strong>, o indicador <strong>{indicator.name}</strong> mede {meaning}. {indicator.themeId === 'illiteracy' || indicator.themeId === 'decent-work' ? 'Não calculamos uma média mundial ou continental com a população total: seriam necessários os denominadores de idade ou força de trabalho de cada indicador.' : average ? `A média ponderada pela população é ${formatValue(average.value, indicator.unit)}, com ${average.coverage} países no cálculo.` : 'A média ponderada está sendo calculada.'}</p>
    {leadingValue && <p>O maior valor disponível no recorte é de <strong>{leadingValue.geographyName}</strong>: {formatValue(leadingValue.value, indicator.unit)}. Isso não significa automaticamente melhor ou pior sem considerar o sentido do indicador.</p>}
    <p>{themeFocus[indicator.themeId]} Há {coverage} países com último dado disponível; os anos podem variar entre territórios.</p>
    <small>Interpretação automatizada por regras transparentes do painel; não é uma resposta de modelo de IA e não envia seus dados a serviços externos.</small>
  </section>
}

function RankingPanel({ title, description, ranking, unit, direction, color, tooltipFormatter }: RankingPanelProps) {
  const directionText = direction === 'neutral'
    ? 'Neste indicador, valores mais altos representam maior volume de registros; a interpretação depende do contexto.'
    : direction === 'higher-worse'
      ? 'Neste indicador, valores mais altos sinalizam maior pressão ou vulnerabilidade.'
      : 'Neste indicador, valores mais altos sinalizam maior acesso, proteção ou capacidade.'
  return <section className="panel ranking-panel"><div className="panel__header"><div><h3>{title}</h3><p>{description}</p><p className={`ranking-meaning ranking-meaning--${direction}`}>{directionText}</p></div>{ranking.length > 0 && <button className="export-button" onClick={() => exportRankingCsv(title, ranking, unit)}>Baixar CSV</button>}</div>{ranking.length > 0 ? <div className="chart"><ResponsiveContainer width="100%" height={340}><BarChart data={[...ranking].reverse()}><CartesianGrid stroke="#334155" strokeDasharray="4 4" /><XAxis type="number" stroke="#a8b8cc" /><YAxis type="category" dataKey="geographyName" width={140} stroke="#a8b8cc" /><Tooltip formatter={tooltipFormatter(unit)} /><Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div> : <p className="ranking-empty">Não há valores disponíveis para este indicador e recorte territorial.</p>}</section>
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
  sectionId?: string
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

function TerritoryComparisonPanel({ sectionId, title, description, territories, selectedCodes, latestValues, chartData, unit, color, territoryLabel, onAdd, onRemove, tooltipFormatter }: TerritoryComparisonPanelProps) {
  const selectedTerritories = territories.filter((territory) => selectedCodes.includes(territory.code))
  const latestByCode = new Map(latestValues.map((item) => [item.geographyCode, item]))
  const territoriesWithoutData = selectedTerritories.filter((territory) => !latestByCode.has(territory.code))
  return <section id={sectionId} className="panel comparison-panel">
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
