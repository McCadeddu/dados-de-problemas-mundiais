import { useEffect, useState } from 'react'
import { povertyValue, type PovertyAggregates } from '../lib/povertyAggregates'
import { aggregateValue } from '../lib/hungerAggregates'

export function PovertyAggregatesPanel({ countryCode, onCountryChange }: { countryCode?: string; onCountryChange?: (code: string) => void }) {
  const [data, setData] = useState<PovertyAggregates | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [year, setYear] = useState<number | null>(null)
  const [historyCode, setHistoryCode] = useState('WLD')
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/poverty-aggregates.json`, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Pobreza indisponível')
      return response.json() as Promise<PovertyAggregates>
    }).then(result => { if (!controller.signal.aborted) { setData(result); setError(false) } }).catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [attempt])
  if (!data) return <section className="panel" aria-label="Agregados oficiais de pobreza">{error ? <><p>Não foi possível carregar os agregados oficiais de pobreza.</p><button onClick={() => { setError(false); setAttempt(a => a + 1) }}>Tentar novamente</button></> : <p>Carregando agregados oficiais de pobreza…</p>}</section>
  const countries = data.areas.filter(a => a.kind === 'country').sort((a, b) => a.name.localeCompare(b.name))
  const country = countries.find(a => a.code === countryCode)
  const aggregates = data.areas.filter(a => a.kind !== 'country').sort((a, b) => a.kind === 'world' ? -1 : b.kind === 'world' ? 1 : a.name.localeCompare(b.name))
  const years = [...new Set(data.series.flatMap(s => s.points.filter(p => p.value !== null).map(p => p.year)))].sort((a, b) => b - a)
  const worldYears = data.series.find(s => s.areaCode === 'WLD')?.points.filter(p => p.value !== null).map(p => p.year) ?? []
  const activeYear = year !== null && years.includes(year) ? year : Math.max(...worldYears)
  const historyArea = data.areas.find(a => a.code === historyCode)
  const history = data.series.find(s => s.areaCode === historyCode)?.points ?? []
  const date = (v: string) => v.slice(0, 10).split('-').reverse().join('/')
  const rows = [...(countryCode ? [country ?? { code: countryCode, name: countryCode, kind: 'country' }] : []), ...aggregates]
  return <section className="panel national-data" aria-label="Agregados oficiais de pobreza">
    <div className="panel__header"><div><h3>{countryCode ? 'Pobreza: país, regiões e mundo' : 'Pobreza: regiões e mundo'}</h3><p>Banco Mundial/PIP via WDI · US$ 8,30 por pessoa/dia · PPC de 2021.</p></div><strong className="badge">{activeYear}</strong></div>
    <p>Valores publicados pela fonte em uma única coleta. Os agregados não são médias recalculadas pelo painel. As regiões do Banco Mundial podem reunir partes de vários continentes; o filtro continental do mapa não altera esta tabela.</p>
    <div className="controls">{onCountryChange && <label>País da comparação de pobreza<select value={country?.code ?? ''} onChange={e => onCountryChange(e.target.value)}>{!country && <option value="">Selecione um país</option>}{countries.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}</select></label>}<label>Ano da comparação oficial de pobreza<select value={activeYear} onChange={e => setYear(Number(e.target.value))}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></label></div>
    <p className="meta">Este complemento tem ano próprio, inicialmente o mais recente com agregado mundial. Todas as linhas abaixo usam o mesmo ano; não buscamos outro ano para preencher ausências.</p>
    <div className="national-data__table"><table><caption>Pobreza abaixo de US$ 8,30/dia (PPC 2021) — {activeYear}</caption><thead><tr><th scope="col">Área da fonte</th><th scope="col">Escala</th><th scope="col">% da população</th><th scope="col">Sinalização da fonte</th></tr></thead><tbody>{rows.map(a => {
      const p = povertyValue(data, a.code, activeYear)
      return <tr key={a.code}><th scope="row">{a.kind === 'world' ? 'Mundo (World)' : a.name}</th><td>{a.kind === 'country' ? 'País/território' : a.kind === 'world' ? 'Mundial' : 'Região Banco Mundial'}</td><td>{aggregateValue(p?.value)}</td><td>{p?.status || '—'}</td></tr>
    })}</tbody></table></div>
    <p>O ano da série nacional pode corresponder à pesquisa disponível; agregados regionais e mundiais usam os procedimentos de estimação da PIP para alinhar referências. Mesmo ano e mesma linha não tornam os métodos idênticos. A API não informa aqui a cobertura amostral dos agregados; sinalização vazia não comprova ausência de estimação. <a href="https://datahelpdesk.worldbank.org/knowledgebase/articles/193313-if-poverty-rates-are-not-available-for-all-countri">Como a fonte trata anos sem pesquisa</a>.</p>
    <p>Não compare diretamente com pobreza relativa Eurostat, linhas nacionais ou pobreza multidimensional. Gini mede distribuição e não recebe um agregado por média de Ginis nacionais.</p>
    <details><summary>Histórico e proveniência da pobreza</summary><div className="controls"><label>Área do histórico de pobreza<select value={historyCode} onChange={e => setHistoryCode(e.target.value)}>{[...aggregates, ...(countryCode ? countries : [])].map(a => <option key={a.code} value={a.code}>{a.name}</option>)}</select></label></div>
      <div className="national-data__table"><table><caption>Histórico oficial — {historyArea?.name}</caption><thead><tr><th scope="col">Ano</th><th scope="col">% da população</th><th scope="col">Sinalização</th></tr></thead><tbody>{[...history].reverse().map(p => <tr key={p.year}><td>{p.year}</td><td>{aggregateValue(p.value)}</td><td>{p.status || '—'}</td></tr>)}</tbody></table></div>
      <p>Definição original: {data.indicator.sourceNote}</p><p>Organização: {data.indicator.sourceOrganization}</p>
      <p><a href={data.methodologyUrl}>Metodologia específica</a> · <a href={data.metadataUrl}>Metadados da API</a> · <a href={data.geographyUrl}>Classificação geográfica</a> · <a href={data.requestUrl}>Consulta dos valores</a></p>
    </details>
    <p className="meta">Atualização da base: {date(data.sourceUpdatedAt)}. Coleta: {date(data.fetchedAt)}. Última tentativa: {date(data.lastAttemptAt)}. {data.cached && 'A última tentativa falhou; exibindo a coleta anterior.'} Este complemento pode ter edição diferente do mapa; compare as datas antes de interpretar divergências.</p>
    <p><a href={`${import.meta.env.BASE_URL}data/poverty-aggregates.csv`} download>Baixar pobreza e proveniência (CSV)</a> · <a href={`${import.meta.env.BASE_URL}data/poverty-aggregates.json`} download>JSON</a> · <a href={data.licenseUrl}>Licença CC BY 4.0 — Banco Mundial</a></p>
  </section>
}
