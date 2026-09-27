import { useEffect, useState } from 'react'
import { HUNGER_AGGREGATE_INDICATORS as definitions, aggregateValue, type HungerAggregates } from '../lib/hungerAggregates'

export function HungerAggregatesPanel({ indicatorId }: { indicatorId: string }) {
  const [data, setData] = useState<HungerAggregates | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [year, setYear] = useState<number | null>(null)
  const [area, setArea] = useState('WLD')
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/hunger-aggregates.json`, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Arquivo indisponível')
      return response.json() as Promise<HungerAggregates>
    }).then(result => { if (!controller.signal.aborted) { setData(result); setError(false) } }).catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [attempt])
  const definition = definitions.find(i => i.id === indicatorId)
  if (!definition) return null
  if (!data) return <section className="panel" aria-label="Agregados oficiais de fome e água">{error ? <><p>Não foi possível carregar os agregados oficiais. Os dados nacionais continuam disponíveis.</p><button onClick={() => { setError(false); setAttempt(a => a + 1) }}>Tentar novamente</button></> : <p>Carregando agregados oficiais de fome e água…</p>}</section>
  const series = data.series.filter(s => s.indicatorId === indicatorId)
  const world = series.find(s => s.areaCode === 'WLD')
  const years = [...new Set(series.flatMap(s => s.points.filter(p => p.value !== null).map(p => p.year)))].sort((a, b) => b - a)
  const activeYear = year !== null && years.includes(year) ? year : world?.points.filter(p => p.value !== null).at(-1)?.year ?? years[0]
  const history = series.find(s => s.areaCode === area)
  const metadata = data.indicators.find(i => i.id === indicatorId)!
  const date = (value: string) => value.slice(0, 10).split('-').reverse().join('/')
  return <section className="panel national-data" aria-label="Agregados oficiais de fome e água">
    <div className="panel__header"><div><h3>Fome e água: agregados oficiais</h3><p>FAO e OMS/UNICEF JMP, distribuídos pelo Banco Mundial. Valores publicados pela fonte, sem recalcular médias dos países.</p></div></div>
    <div className="hunger-water-panel__grid">{definitions.map(i => {
      const latest = data.series.find(s => s.indicatorId === i.id && s.areaCode === 'WLD')?.points.filter(p => p.value !== null).at(-1)
      return <article key={i.id}><h4>{i.name}</h4><strong>{aggregateValue(latest?.value)}</strong><p>Mundo · {latest ? `ano da fonte: ${latest.year}` : 'sem ano disponível'}</p>{latest?.status && <p>Sinalização: {latest.status}</p>}</article>
    })}</div>
    <p>Os cartões podem ter anos diferentes. Subalimentação e insegurança alimentar medem aspectos distintos. Água gerida com segurança já está incluída no acesso pelo menos básico; não some essas medidas.</p>
    <h4>{definition.name}</h4><p>{definition.definition}</p><p>{definition.note}</p>
    <p>Use o seletor <strong>Indicador</strong> no início da página para mudar a medida desta tabela. As regiões abaixo são grupos do Banco Mundial, não os continentes do mapa; o filtro continental não altera este complemento. Os nomes originais da fonte estão preservados.</p>
    <div className="controls"><label>Ano dos agregados oficiais<select value={activeYear ?? ''} onChange={event => setYear(Number(event.target.value))}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></label></div>
    <div className="national-data__table"><table><caption>{definition.name} — {activeYear ?? 'sem ano'}, percentual da população de cada área</caption>
      <thead><tr><th scope="col">Área publicada pela fonte</th><th scope="col">Valor</th><th scope="col">Sinalização</th></tr></thead>
      <tbody>{[...data.areas].sort((a, b) => a.code === 'WLD' ? -1 : b.code === 'WLD' ? 1 : a.name.localeCompare(b.name)).map(a => {
        const point = series.find(s => s.areaCode === a.code)?.points.find(p => p.year === activeYear)
        return <tr key={a.code}><th scope="row">{a.code === 'WLD' ? 'Mundo (World)' : a.name}</th><td>{aggregateValue(point?.value)}</td><td>{point?.status || '—'}</td></tr>
      })}</tbody>
    </table></div>
    <p className="meta">Todas as linhas usam o ano selecionado. Sem observação permanece ausente; não buscamos outro ano para preencher a tabela. Os agregados podem ter cobertura parcial e regras próprias de estimação; a API não informa aqui a proporção da população coberta. Regiões podem mudar de composição entre edições.</p>
    <details><summary>Ver histórico oficial e definição da fonte</summary>
      <div className="controls"><label>Área do histórico oficial<select value={area} onChange={event => setArea(event.target.value)}>{data.areas.map(a => <option key={a.code} value={a.code}>{a.code === 'WLD' ? 'Mundo (World)' : a.name}</option>)}</select></label></div>
      <div className="national-data__table"><table><caption>Histórico: {definition.name} · {data.areas.find(a => a.code === area)?.name}</caption><thead><tr><th scope="col">Ano da fonte</th><th scope="col">Valor</th><th scope="col">Sinalização</th></tr></thead><tbody>{[...(history?.points ?? [])].reverse().map(p => <tr key={p.year}><td>{p.year}</td><td>{aggregateValue(p.value)}</td><td>{p.status || '—'}</td></tr>)}</tbody></table></div>
      <p>Definição original: {metadata.sourceNote}</p><p>Organização indicada pela fonte: {metadata.sourceOrganization}</p>
      <p><a href={metadata.methodologyUrl}>Metodologia do indicador</a> · <a href={metadata.metadataUrl}>Metadados da API</a> · <a href={data.areaRequestUrl}>Nomes e códigos das áreas</a> · <a href={data.requestUrl}>Consulta dos valores</a></p>
    </details>
    <p className="meta">Atualização da base: {date(data.sourceUpdatedAt)}. Coleta: {date(data.fetchedAt)}. Última tentativa: {date(data.lastAttemptAt)}. {data.cached && 'A última tentativa falhou; exibindo a coleta anterior.'}</p>
    <p className="meta">Seleção e apresentação pelo Mundialidade · <a href={data.licenseUrl}>CC BY 4.0 — Banco Mundial</a> · <a href={`${import.meta.env.BASE_URL}data/hunger-aggregates.csv`} download>Baixar agregados e proveniência (CSV)</a> · <a href={`${import.meta.env.BASE_URL}data/hunger-aggregates.json`} download>JSON</a>.</p>
  </section>
}
