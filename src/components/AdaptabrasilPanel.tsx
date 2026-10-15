import { useEffect, useState } from 'react'
import type { FeatureCollection } from 'geojson'
import { adaptaCsv, parseAdaptaData, type AdaptaData, type AdaptaSnapshot } from '../lib/adaptabrasil'
import { MapPanel } from './MapPanel'

const horizonLabel = (s: AdaptaSnapshot) => s.yearLabel === String(s.year) ? s.yearLabel : `${s.yearLabel} (${s.year})`

export function AdaptabrasilPanel({ stateCode, onStateChange, selectionKey, onSelectionChange, comparisonCode, onComparisonChange }: {
  stateCode: string; onStateChange: (code: string) => void; selectionKey: string; onSelectionChange: (key: string) => void;
  comparisonCode: string; onComparisonChange: (code: string) => void
}) {
  const [data, setData] = useState<AdaptaData | null>(null)
  const [geography, setGeography] = useState<FeatureCollection | null>(null)
  const [error, setError] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    const get = async (file: string) => {
      const response = await fetch(`${import.meta.env.BASE_URL}data/${file}`, { signal: controller.signal })
      if (!response.ok) throw new Error('Arquivo indisponível')
      return response.json() as Promise<unknown>
    }
    get('adaptabrasil.json').then(parseAdaptaData).then(result => { if (!controller.signal.aborted) { setData(result); setError(false) } })
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    get('geo/brazil-states.geojson').then(result => {
      const geo = result as FeatureCollection
      if (geo.type !== 'FeatureCollection' || !geo.features?.length) throw new Error('Malha indisponível')
      if (!controller.signal.aborted) { setGeography(geo); setMapError(false) }
    }).catch(() => { if (!controller.signal.aborted) setMapError(true) })
    return () => controller.abort()
  }, [attempt])
  const retry = () => { setError(false); setMapError(false); setAttempt(a => a + 1) }
  if (!data) return <section className="panel" aria-label="AdaptaBrasil por UF">{error ? <><p role="alert">Não foi possível carregar o complemento AdaptaBrasil. Os demais indicadores continuam disponíveis.</p><button onClick={retry}>Tentar carregar AdaptaBrasil novamente</button></> : <p role="status">Carregando índice oficial AdaptaBrasil…</p>}</section>
  const selected = data.snapshots.find(s => s.key === selectionKey) ?? data.snapshots.find(s => s.scenarioId === null)!
  const selectedState = selected.states.find(s => s.code === stateCode)
  const compare = comparisonCode !== stateCode ? selected.states.find(s => s.code === comparisonCode) : undefined
  const context = `${horizonLabel(selected)} · ${selected.scenarioLabel}`
  const value = (n: number | null) => n === null ? 'Sem dado' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  function download() {
    const url = URL.createObjectURL(new Blob([adaptaCsv(data!, selected)], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `adaptabrasil-estresse-hidrico-uf-${selected.key}.csv`; anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <section className="panel national-data" aria-label="AdaptaBrasil por UF">
    <div className="panel__header"><div><h3>Brasil · AdaptaBrasil: risco de estresse hídrico por UF</h3><p>{data.definition}</p></div><strong className="badge">{selected.scenarioId === null ? 'Referência do presente' : 'Cenário futuro'}</strong></div>
    <p>Índice na escala fixa de 0 a 1, sem unidade física. Não é percentual nem probabilidade de faltar água. Este complemento usa os valores por UF publicados pela fonte; não calcula médias de municípios e não combina o índice com ND-GAIN ou focos de fogo do INPE.</p>
    <div className="controls">
      <label>Referência ou cenário AdaptaBrasil<select value={selected.key} onChange={e => onSelectionChange(e.target.value)}>{data.snapshots.map(s => <option key={s.key} value={s.key}>{horizonLabel(s)} · {s.scenarioLabel}</option>)}</select></label>
      <label>UF AdaptaBrasil<select value={selectedState?.code ?? ''} onChange={e => onStateChange(e.target.value)}>{!selectedState && <option value="">Escolher UF</option>}{selected.states.map(s => <option key={s.code} value={s.code}>{s.name} ({s.abbreviation})</option>)}</select></label>
      <label>Comparar com outra UF<select value={compare?.code ?? ''} onChange={e => onComparisonChange(e.target.value)}><option value="">Escolher outra UF</option>{selected.states.filter(s => s.code !== stateCode).map(s => <option key={s.code} value={s.code}>{s.name} ({s.abbreviation})</option>)}</select></label>
    </div>
    <p><strong>{context}</strong>. {selected.period}</p>
    {selected.scenarioDescription && <p>{selected.scenarioDescription}</p>}
    <p>“Presente” é o rótulo de referência da fonte, não uma medição em tempo real. Os horizontes futuros representam períodos e cenários; não são observações ocorridas nem previsões pontuais garantidas. Os seletores acima controlam somente este complemento.</p>
    <div className="adapta-comparison" aria-label="Comparação de UFs no mesmo cenário">{[selectedState, compare].filter(s => !!s).map(s => <article key={s.code}><h4>{s.name} ({s.abbreviation})</h4><strong>{value(s.value)}</strong><p>{s.category}</p><small>{context}</small></article>)}</div>
    <p role="status">{selected.states.filter(s => s.value !== null).length} de {selected.states.length} UFs com índice neste recorte. Ausência não é zero.</p>
    {geography ? <MapPanel title="AdaptaBrasil · mapa das UFs" subtitle={context} geography={geography}
      valueByCode={new Map(selected.states.filter(s => s.value !== null).map(s => [s.code, { name: `${s.name} · ${s.category}`, value: s.value! }]))}
      codeKeys={['sidra_code']} selectedCode={stateCode} onSelect={onStateChange} direction="higher-worse" valueDomain={[0, 1]}
      formatValue={n => value(n)} colors={data.legend.map(l => l.color)} directionExplanation="Valores maiores indicam maior risco no índice AdaptaBrasil, dentro deste cenário e recorte. Escala e faixas fixas da fonte." />
      : mapError ? <div role="alert"><p>O mapa das UFs não carregou. Valores e tabelas permanecem disponíveis.</p><button onClick={retry}>Tentar carregar mapa novamente</button></div> : <p role="status">Carregando mapa das UFs…</p>}
    <p>Faixas da fonte: {data.legend.map(l => `${l.label}: ${value(l.minvalue)}–${value(l.maxvalue)}`).join(' · ')}.</p>
    <details><summary>Ver os índices das 27 UFs neste recorte</summary><div className="national-data__table"><table><caption>{data.indicatorName} · {context} · ordem alfabética</caption><thead><tr><th scope="col">UF</th><th scope="col">Código IBGE</th><th scope="col">Índice (0–1)</th><th scope="col">Faixa publicada</th></tr></thead><tbody>{selected.states.map(s => <tr key={s.code}><th scope="row">{s.name} ({s.abbreviation})</th><td>{s.code}</td><td>{value(s.value)}</td><td>{s.category}</td></tr>)}</tbody></table></div></details>
    <p><button className="export-button" onClick={download}>Baixar índices deste cenário (CSV)</button> · <a href={selected.portalUrl} target="_blank" rel="noreferrer">Abrir este recorte na fonte oficial</a> · <a href={`${import.meta.env.BASE_URL}data/adaptabrasil.json`} download>Cenários e metadados (JSON)</a> · <a href={`${import.meta.env.BASE_URL}data/${data.sourceFile}`} download>Respostas e correspondência territorial (JSON)</a></p>
    <details><summary>Fonte e controle territorial</summary><p>Fonte: AdaptaBrasil MCTI, setor {data.sector}. Consulta em {data.fetchedAt.slice(0, 10).split('-').reverse().join('/')}.</p>
      <p>Siglas e nomes são conferidos com o <a href={data.crosswalkSourceUrl}>quadro de UFs do IBGE</a>, revisado em {data.crosswalkReviewedAt.split('-').reverse().join('/')}.</p>
      {data.crosswalkWarnings.map(w => <p key={w.abbreviation}>{w.abbreviation}: código recebido {w.sourceCode}; código IBGE utilizado {w.ibgeCode}, por correspondência validada de sigla e nome. O código original está preservado nos arquivos.</p>)}
      <p>Valores, faixas e cenários são preservados como publicados. Os dados por UF não descrevem todas as diferenças municipais. Não há agregado mundial ou continental deste complemento.</p>
    </details>
  </section>
}
