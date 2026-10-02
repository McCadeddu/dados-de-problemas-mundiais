import { useEffect, useState } from 'react'
import { INCOME_DISTRIBUTION, incomePairYears, type IncomeDistribution } from '../lib/incomeDistribution'
import { aggregateValue } from '../lib/hungerAggregates'

export function IncomeDistributionPanel({ countryCode, countryName }: { countryCode: string; countryName: string }) {
  const [data, setData] = useState<IncomeDistribution | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/income-distribution.json`, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Distribuição indisponível')
      return response.json() as Promise<IncomeDistribution>
    }).then(result => { if (!controller.signal.aborted) { setData(result); setError(false) } }).catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [attempt])
  if (!data) return <section className="panel" aria-label="Distribuição da renda ou consumo">{error ? <><p>Não foi possível carregar a distribuição.</p><button onClick={() => { setError(false); setAttempt(a => a + 1) }}>Tentar novamente</button></> : <p>Carregando distribuição da renda ou consumo…</p>}</section>
  const years = incomePairYears(data, countryCode)
  const year = selectedYear !== null && years.includes(selectedYear) ? selectedYear : years[0]
  const series = INCOME_DISTRIBUTION.map(d => data.series.find(s => s.indicatorId === d.id && s.countryCode === countryCode))
  const historyYears = [...new Set(series.flatMap(s => s?.points.map(p => p.year) ?? []))].sort((a, b) => b - a)
  const point = (index: number, y: number) => series[index]?.points.find(p => p.year === y)
  const date = (v: string) => v.slice(0, 10).split('-').reverse().join('/')
  return <section className="panel national-data" aria-label="Distribuição da renda ou consumo">
    <div className="panel__header"><div><h3>Distribuição da renda ou consumo — {countryName}</h3><p>Parcelas da distribuição nacional, Banco Mundial/PIP via WDI.</p></div><strong className="badge">{year ?? 'Sem ano comum'}</strong></div>
    <p>Os grupos são definidos pela posição na distribuição per capita de cada país. A medida usa renda ou consumo da pesquisa domiciliar. Ela não mede patrimônio acumulado; o grupo mais rico reúne 10% das pessoas, enquanto o mais pobre reúne 20%.</p>
    {year !== undefined ? <><div className="controls"><label>Ano comum da distribuição<select value={year} onChange={e => setSelectedYear(Number(e.target.value))}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></label></div>
      <div className="hunger-water-panel__grid">{INCOME_DISTRIBUTION.map((d, i) => <article key={d.id}><h4>{d.name}</h4><strong>{aggregateValue(point(i, year)?.value)}</strong><p>Pesquisa: {year}. Parcela do total nacional.</p>{point(i, year)?.status && <p>Sinalização: {point(i, year)?.status}</p>}</article>)}</div></> : <p role="status">Sem observações das duas parcelas no mesmo ano para este país. Consulte o histórico; valores de anos distintos não preenchem este recorte.</p>}
    <p>Mesmo ano não comprova a mesma pesquisa ou conceito: esta API não identifica por observação se a distribuição usa renda ou consumo, nem fornece aqui o identificador da pesquisa. Confira a PIP antes de comparar países ou interpretar mudanças históricas. Status vazio não comprova ausência de estimação.</p>
    <details><summary>Histórico e fontes da distribuição</summary>
      <div className="national-data__table"><table><caption>Parcelas nacionais por ano — {countryName}</caption><thead><tr><th scope="col">Ano da pesquisa</th>{INCOME_DISTRIBUTION.map(d => <th key={d.id} scope="col">{d.name}</th>)}</tr></thead><tbody>{historyYears.map(y => <tr key={y}><td>{y}</td>{INCOME_DISTRIBUTION.map((d, i) => <td key={d.id}>{aggregateValue(point(i, y)?.value)}{point(i, y)?.status && ` · ${point(i, y)?.status}`}</td>)}</tr>)}</tbody></table></div>
      {data.indicators.map(meta => <div key={meta.id}><h4>{INCOME_DISTRIBUTION.find(d => d.id === meta.id)?.name}</h4><p>{meta.sourceNote}</p><p>{meta.sourceOrganization}</p><p><a href={meta.methodologyUrl}>Metodologia da parcela</a> · <a href={meta.metadataUrl}>Metadados</a> · <a href={meta.requestUrl}>Consulta dos valores</a></p></div>)}
    </details>
    <p className="meta">Atualização da base: {date(data.sourceUpdatedAt)}. Coleta: {date(data.fetchedAt)}. Última tentativa: {date(data.lastAttemptAt)}. {data.cached && 'A última tentativa falhou; exibindo a coleta anterior.'}</p>
    <p><a href={`${import.meta.env.BASE_URL}data/income-distribution.csv`} download>Baixar distribuição e proveniência (CSV)</a> · <a href={`${import.meta.env.BASE_URL}data/income-distribution.json`} download>JSON</a> · <a href={data.licenseUrl}>CC BY 4.0 — Banco Mundial</a> · <a href="https://pip.worldbank.org/">Poverty and Inequality Platform</a></p>
  </section>
}
