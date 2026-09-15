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
  getSeriesForGeography,
  getTopRanked,
} from './lib/dashboard'
import type { DashboardData } from './types'

type GeoJson = GeoJSON.FeatureCollection
type ViewMode = 'world' | 'states'

function App() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [worldGeo, setWorldGeo] = useState<GeoJson | null>(null)
  const [brazilGeo, setBrazilGeo] = useState<GeoJson | null>(null)
  const [view, setView] = useState<ViewMode>('world')
  const [themeId, setThemeId] = useState('hunger-water')
  const [selectedIndicatorId, setSelectedIndicatorId] = useState('')
  const [countryCode, setCountryCode] = useState('BRA')
  const [stateCode, setStateCode] = useState('35')
  const [comparisonStateCodes, setComparisonStateCodes] = useState(['35', '29', '15'])

  useEffect(() => {
    const dataBaseUrl = import.meta.env.BASE_URL
    Promise.all([
      fetch(`${dataBaseUrl}data/mundialidade.json`).then((response) => response.json() as Promise<DashboardData>),
      fetch(`${dataBaseUrl}data/geo/world.geojson`).then((response) => response.json() as Promise<GeoJson>),
      fetch(`${dataBaseUrl}data/geo/brazil-states.geojson`).then((response) => response.json() as Promise<GeoJson>),
    ]).then(([dashboardData, world, brazil]) => {
      setData(dashboardData)
      setWorldGeo(world)
      setBrazilGeo(brazil)
    })
  }, [])

  const themeIndicators = data ? getIndicatorsByTheme(data, themeId).filter(
    (item) => item.geographyType === 'country',
  ) : []
  const indicatorId = themeIndicators.some((item) => item.id === selectedIndicatorId)
    ? selectedIndicatorId
    : data
      ? getDefaultIndicator(data, themeId)?.id ?? ''
      : ''
  const indicator = data && indicatorId ? getIndicator(data, indicatorId) : undefined
  const brazilIndicator = data?.indicators.find((item) => item.geographyType === 'brazil-state')
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

  if (!data || !worldGeo || !brazilGeo || !indicator || !brazilIndicator) {
    return <main className="shell"><p>Carregando painel e séries...</p></main>
  }

  const summary = getMetricSummary(data)
  const countryName = data.countries.find((country) => country.code === countryCode)?.name ?? countryCode
  const stateName = data.brazilStates.find((state) => state.code === stateCode)?.name ?? stateCode
  const activeIndicator = view === 'world' ? indicator : brazilIndicator
  const activeSource = data.sources.find((source) => source.id === activeIndicator.sourceId)
  const activeRanking = getTopRanked(data, activeIndicator.id, 10)
  const comparisonStates = data.brazilStates.filter((state) => comparisonStateCodes.includes(state.code))
  const comparisonLatest = brazilLatest.filter((item) => comparisonStateCodes.includes(item.geographyCode))
  const comparisonChartData = Array.from(
    new Set(comparisonStates.flatMap((state) => (
      getSeriesForGeography(data, brazilIndicator.id, state.code)?.points.map((point) => point.year) ?? []
    ))),
  ).sort((a, b) => a - b).map((year) => {
    const row: Record<string, number | string> = { year }
    comparisonStates.forEach((state) => {
      const point = getSeriesForGeography(data, brazilIndicator.id, state.code)?.points.find(
        (item) => item.year === year,
      )
      if (point) row[state.code] = point.value
    })
    return row
  })
  const addComparisonState = (code: string) => {
    if (!code || comparisonStateCodes.includes(code) || comparisonStateCodes.length >= 5) return
    setComparisonStateCodes((current) => [...current, code])
  }
  const removeComparisonState = (code: string) => {
    if (comparisonStateCodes.length <= 2) return
    setComparisonStateCodes((current) => current.filter((item) => item !== code))
  }
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
        </div>
        <div className="hero__grid">
          <article className="stat"><strong>{summary.countries}</strong><span>países comparáveis</span></article>
          <article className="stat"><strong>{summary.states}</strong><span>estados brasileiros</span></article>
          <article className="stat"><strong>{data.indicators.length}</strong><span>indicadores ativos</span></article>
          <article className="stat"><strong>{new Date(data.generatedAt).toLocaleDateString('pt-BR')}</strong><span>gerado em</span></article>
        </div>
      </section>

      <nav className="view-switcher" aria-label="Escala de análise">
        <button className={view === 'world' ? 'is-active' : ''} onClick={() => setView('world')}>
          Mundo
          <span>Comparar países e tendências globais</span>
        </button>
        <button className={view === 'states' ? 'is-active' : ''} onClick={() => setView('states')}>
          Estados
          <span>Visualizar as unidades federativas do Brasil</span>
        </button>
      </nav>

      {view === 'world' ? (
        <>
          <section className="panel controls controls--world">
            <label>Tema<select value={themeId} onChange={(event) => setThemeId(event.target.value)}>{data.themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></label>
            <label>Indicador<select value={indicatorId} onChange={(event) => setSelectedIndicatorId(event.target.value)}>{themeIndicators.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>País<select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>{data.countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
          </section>

          <section className="content-grid content-grid--world">
            <MapPanel title="Mapa mundial" subtitle={`${indicator.name} • clique para selecionar um país`} geography={worldGeo} valueByCode={worldValueByCode} codeKeys={['ADM0_A3', 'ISO_A3', 'SOV_A3', 'gu_a3']} onSelect={setCountryCode} selectedCode={countryCode} formatValue={(value) => formatValue(value, indicator.unit)} projectionKind="peters" />
            <article className="panel">
              <div className="panel__header"><div><h3>{countryName}</h3><p>{indicator.description}</p></div><strong className="badge">{indicator.latestYear}</strong></div>
              <div className="chart"><ResponsiveContainer width="100%" height={300}><LineChart data={selectedCountrySeries?.points ?? []}><CartesianGrid stroke="#334155" strokeDasharray="4 4" /><XAxis dataKey="year" stroke="#a8b8cc" /><YAxis stroke="#a8b8cc" /><Tooltip formatter={tooltipFormatter(indicator.unit)} /><Line type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div>
              <p className="meta">Fonte: <a href={activeSource?.url}>{activeSource?.name}</a> • Atualização conhecida: {activeSource?.lastUpdated}</p>
            </article>
          </section>
          <RankingPanel title="Ranking global" description="10 países com os maiores valores para o indicador selecionado." ranking={activeRanking} unit={indicator.unit} color="#2563eb" tooltipFormatter={tooltipFormatter} />
        </>
      ) : (
        <>
          <section className="panel controls controls--states">
            <label>Estado do Brasil<select value={stateCode} onChange={(event) => setStateCode(event.target.value)}>{data.brazilStates.map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}</select></label>
            <p className="controls__context">Indicador estadual disponível: <strong>{brazilIndicator.name}</strong>. Novas tabelas do IBGE podem ser adicionadas pelo conector de dados.</p>
          </section>
          <section className="content-grid content-grid--states">
            <MapPanel title="Mapa dos estados brasileiros" subtitle={`${brazilIndicator.name} • clique para selecionar uma UF`} geography={brazilGeo} valueByCode={brazilValueByCode} codeKeys={['sidra_code', 'iso_3166_2', 'postal']} onSelect={setStateCode} selectedCode={stateCode} formatValue={(value) => formatValue(value, brazilIndicator.unit)} />
            <article className="panel">
              <div className="panel__header"><div><h3>{stateName}</h3><p>{brazilIndicator.description}</p></div><strong className="badge">{brazilIndicator.latestYear}</strong></div>
              <div className="chart"><ResponsiveContainer width="100%" height={300}><LineChart data={selectedStateSeries?.points ?? []}><CartesianGrid stroke="#334155" strokeDasharray="4 4" /><XAxis dataKey="year" stroke="#a8b8cc" /><YAxis stroke="#a8b8cc" /><Tooltip formatter={tooltipFormatter(brazilIndicator.unit)} /><Line type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div>
              <p className="meta">Fonte: <a href={activeSource?.url}>{activeSource?.name}</a> • Atualização conhecida: {activeSource?.lastUpdated}</p>
            </article>
          </section>
          <RankingPanel title="Ranking entre estados" description="10 UFs com os maiores valores no indicador estadual disponível." ranking={activeRanking} unit={brazilIndicator.unit} color="#b45309" tooltipFormatter={tooltipFormatter} />
          <StateComparisonPanel
            states={data.brazilStates}
            selectedCodes={comparisonStateCodes}
            latestValues={comparisonLatest}
            chartData={comparisonChartData}
            unit={brazilIndicator.unit}
            onAdd={addComparisonState}
            onRemove={removeComparisonState}
            tooltipFormatter={tooltipFormatter}
          />
        </>
      )}

      <section className="content-grid content-grid--footer">
        <article className="panel"><div className="panel__header"><div><h3>Arquitetura pronta para crescer</h3><p>Coleta, processamento e visualização permanecem separados.</p></div></div><ul className="stack-list"><li><strong>Coleta:</strong> conectores por fonte em `scripts/data`.</li><li><strong>Processamento:</strong> schema único para séries, rankings e metadados.</li><li><strong>Frontend:</strong> dados estáticos em `public/data`, sem dependência direta das APIs.</li></ul></article>
        <article className="panel"><div className="panel__header"><div><h3>Fonte e metodologia da visão</h3><p>Dados e critérios do indicador atualmente selecionado.</p></div></div><div className="source-summary"><strong>{activeSource?.name}</strong><p><a href={activeSource?.url}>fonte</a> • <a href={activeSource?.methodologyUrl}>metodologia</a></p><p>Licença: {activeSource?.license} • Atualização: {activeSource?.lastUpdated}</p></div></article>
      </section>
    </main>
  )
}

type RankingPanelProps = {
  title: string
  description: string
  ranking: DashboardData['latest']
  unit: string
  color: string
  tooltipFormatter: (unit: string) => (value: unknown) => string
}

function RankingPanel({ title, description, ranking, unit, color, tooltipFormatter }: RankingPanelProps) {
  return <section className="panel ranking-panel"><div className="panel__header"><div><h3>{title}</h3><p>{description}</p></div></div><div className="chart"><ResponsiveContainer width="100%" height={340}><BarChart data={[...ranking].reverse()}><CartesianGrid stroke="#334155" strokeDasharray="4 4" /><XAxis type="number" stroke="#a8b8cc" /><YAxis type="category" dataKey="geographyName" width={140} stroke="#a8b8cc" /><Tooltip formatter={tooltipFormatter(unit)} /><Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div></section>
}

type StateComparisonPanelProps = {
  states: DashboardData['brazilStates']
  selectedCodes: string[]
  latestValues: DashboardData['latest']
  chartData: Array<Record<string, number | string>>
  unit: string
  onAdd: (code: string) => void
  onRemove: (code: string) => void
  tooltipFormatter: (unit: string) => (value: unknown) => string
}

const COMPARISON_COLORS = ['#b45309', '#0f766e', '#2563eb', '#9333ea', '#be123c']

function StateComparisonPanel({ states, selectedCodes, latestValues, chartData, unit, onAdd, onRemove, tooltipFormatter }: StateComparisonPanelProps) {
  const selectedStates = states.filter((state) => selectedCodes.includes(state.code))
  const latestByCode = new Map(latestValues.map((item) => [item.geographyCode, item]))
  return <section className="panel comparison-panel">
    <div className="panel__header"><div><h3>Comparar estados</h3><p>Selecione de 2 a 5 UFs para comparar a evolução e o valor mais recente do indicador.</p></div></div>
    <div className="comparison-controls">
      <select aria-label="Adicionar estado à comparação" defaultValue="" onChange={(event) => { onAdd(event.target.value); event.target.value = '' }}>
        <option value="">Adicionar estado</option>
        {states.filter((state) => !selectedCodes.includes(state.code)).map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}
      </select>
      <div className="comparison-chips">
        {selectedStates.map((state, index) => <button key={state.code} className="comparison-chip" style={{ '--chip-color': COMPARISON_COLORS[index] } as CSSProperties} onClick={() => onRemove(state.code)} title="Remover da comparação">{state.name} <span>×</span></button>)}
      </div>
    </div>
    <div className="comparison-grid">
      <div className="chart"><h4>Evolução histórica</h4><ResponsiveContainer width="100%" height={300}><LineChart data={chartData}><CartesianGrid stroke="#cbd5e1" strokeDasharray="4 4" /><XAxis dataKey="year" /><YAxis /><Tooltip formatter={tooltipFormatter(unit)} />{selectedStates.map((state, index) => <Line key={state.code} type="monotone" dataKey={state.code} name={state.name} stroke={COMPARISON_COLORS[index]} strokeWidth={3} dot={false} />)}</LineChart></ResponsiveContainer></div>
      <div className="chart"><h4>Último valor disponível</h4><ResponsiveContainer width="100%" height={300}><BarChart data={selectedStates.map((state) => ({ name: state.name, value: latestByCode.get(state.code)?.value ?? 0 }))}><CartesianGrid stroke="#cbd5e1" strokeDasharray="4 4" /><XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={70} /><YAxis /><Tooltip formatter={tooltipFormatter(unit)} /><Bar dataKey="value" fill="#b45309" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
    </div>
  </section>
}

export default App
