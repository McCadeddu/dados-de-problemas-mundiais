import { useEffect, useState } from 'react'
import { INCOME_DISTRIBUTION, incomePairYears, type IncomeDistribution } from '../lib/incomeDistribution'
import { aggregateValue } from '../lib/hungerAggregates'
import { IncomeSurveyEvidence } from './IncomeSurveyEvidence'
import { incomeHistoryLabels, incomeHistoryRows } from '../lib/incomeHistory'

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
  const history = incomeHistoryRows({ ...data, series: series.filter(s => s !== undefined) })
  const transitions = history.filter(row => row.status === 'changed')
  const date = (v: string) => v.slice(0, 10).split('-').reverse().join('/')
  return <section className="panel national-data" aria-label="Distribuição da renda ou consumo">
    <div className="panel__header"><div><h3>Distribuição da renda ou consumo — {countryName}</h3><p>Parcelas da população abrangida pela pesquisa, Banco Mundial/PIP via WDI.</p></div><strong className="badge">{year ?? 'Sem ano comum'}</strong></div>
    <p>Os grupos são definidos pela posição na distribuição per capita de cada país. A medida usa renda ou consumo da pesquisa domiciliar. Ela não mede patrimônio acumulado; o grupo mais rico reúne 10% das pessoas, enquanto o mais pobre reúne 20%.</p>
    {year !== undefined ? <><div className="controls"><label>Ano comum da distribuição<select value={year} onChange={e => setSelectedYear(Number(e.target.value))}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></label></div>
      <div className="hunger-water-panel__grid">{INCOME_DISTRIBUTION.map((d, i) => <article key={d.id}><h4>{d.name}</h4><strong>{aggregateValue(point(i, year)?.value)}</strong><p>Ano: {year}. Parcela do total da população abrangida pela pesquisa.</p>{point(i, year)?.sourceIncomeMetadata && <p>Identificação pela WDI: {point(i, year)?.sourceIncomeMetadata?.surveyAcronym}; conceito {point(i, year)?.sourceIncomeMetadata?.welfareType === 'income' ? 'renda' : 'consumo'}; distribuição {point(i, year)?.sourceIncomeMetadata?.distributionType === 'unit-record' ? 'calculada de microdados' : 'estimada de dados agrupados'}. {point(i, year)?.sourceIncomeMetadata?.coverageRestriction === 'urban-only' ? 'Cobertura apenas urbana.' : 'A nota não explicita restrição de cobertura.'}</p>}<p>Nota WDI: {point(i, year)?.sourceFootnote || 'Não disponível; conceito e pesquisa não são inferidos.'}</p>{point(i, year)?.status && <p>Sinalização: {point(i, year)?.status}</p>}</article>)}</div></> : <p role="status">Sem observações das duas parcelas no mesmo ano para este país. Consulte o histórico; valores de anos distintos não preenchem este recorte.</p>}
    <p>Mesmo ano não comprova a mesma pesquisa ou conceito. As notas WDI acima identificam a pesquisa e o conceito quando disponíveis e reconhecidas. A conferência PIP abaixo é separada e pode corresponder a outra edição. Status vazio não comprova ausência de estimação.</p>
    {year !== undefined && <IncomeSurveyEvidence countryCode={countryCode} year={year} wdiFetchedAt={data.fetchedAt} />}
    <div aria-label="Controle das mudanças no histórico"><h4>Antes de interpretar a evolução</h4><p>{transitions.length ? `${transitions.length} transições com mudança declarada nas notas WDI, contando as duas séries separadamente.` : 'Nenhuma mudança declarada foi identificada nos campos disponíveis deste histórico.'} Ausência de mudança identificada não comprova continuidade metodológica. Pesquisa, conceito, uso de microdados/dados agrupados e restrição de cobertura são conferidos entre observações disponíveis. Lacunas e notas desconhecidas permanecem explícitas.</p>
      {!!transitions.length && <ul>{transitions.map(row => <li key={`${row.indicatorId}-${row.year}`}>{INCOME_DISTRIBUTION.find(d => d.id === row.indicatorId)?.name}: {row.previousYear} → {row.year}; mudou {row.changes.join(', ')}.{row.gapYears! > 1 && ` Intervalo de ${row.gapYears} anos; não é uma variação anual.`}</li>)}</ul>}
    </div>
    <details><summary>Histórico e fontes da distribuição</summary>
      <p>A referência anterior é o último ano com valor nesta série, mesmo quando há anos ausentes entre eles. O controle descreve notas; não calcula variação atribuída à troca de pesquisa.</p>
      <div className="national-data__table"><table><caption>Parcelas da população pesquisada por ano — {countryName}</caption><thead><tr><th scope="col">Ano da pesquisa</th>{INCOME_DISTRIBUTION.map(d => <th key={d.id} scope="col">{d.name}</th>)}</tr></thead><tbody>{historyYears.map(y => <tr key={y}><td>{y}</td>{INCOME_DISTRIBUTION.map((d, i) => {
        const row = history.find(r => r.year === y && r.indicatorId === d.id)
        const metadata = point(i, y)?.sourceIncomeMetadata
        return <td key={d.id}>{aggregateValue(point(i, y)?.value)}{point(i, y)?.status && ` · ${point(i, y)?.status}`}<p>{metadata ? `${metadata.surveyAcronym}; ${metadata.welfareType === 'income' ? 'renda' : 'consumo'}; ${metadata.distributionType === 'unit-record' ? 'microdados' : 'dados agrupados'}; ${metadata.coverageRestriction === 'urban-only' ? 'apenas urbana' : 'restrição de cobertura não declarada'}` : 'Pesquisa/conceito não identificados na nota'}</p><p>{row ? incomeHistoryLabels[row.status] : 'Sem observação'}{row?.status === 'changed' && `: ${row.changes.join(', ')}`}{row?.value !== null && row?.previousYear !== null && row?.previousYear !== undefined && `; referência anterior ${row.previousYear}; intervalo de ${row.gapYears} ano(s).`}</p><details><summary>Nota WDI de {y}</summary><p>{point(i, y)?.sourceFootnote || 'Não disponível'}</p></details></td>
      })}</tr>)}</tbody></table></div>
      {data.indicators.map(meta => <div key={meta.id}><h4>{INCOME_DISTRIBUTION.find(d => d.id === meta.id)?.name}</h4><p>{meta.sourceNote}</p><p>{meta.sourceOrganization}</p><p><a href={meta.methodologyUrl}>Metodologia da parcela</a> · <a href={meta.metadataUrl}>Metadados</a> · <a href={meta.requestUrl}>Consulta dos valores</a></p></div>)}
    </details>
    <p className="meta">Atualização da base: {date(data.sourceUpdatedAt)}. Coleta: {date(data.fetchedAt)}. Última tentativa: {date(data.lastAttemptAt)}. {data.cached && 'A última tentativa falhou; exibindo a coleta anterior.'}</p>
    <p><a href={`${import.meta.env.BASE_URL}data/income-distribution.csv`} download>Baixar distribuição e proveniência (CSV)</a> · <a href={`${import.meta.env.BASE_URL}data/income-distribution.json`} download>JSON</a> · <a href={data.licenseUrl}>CC BY 4.0 — Banco Mundial</a> · <a href="https://pip.worldbank.org/">Poverty and Inequality Platform</a></p>
    <p><a href={`${import.meta.env.BASE_URL}data/income-history-review.csv`} download>Baixar controle do histórico (CSV)</a> · <a href={`${import.meta.env.BASE_URL}data/income-history-review.json`} download>JSON do controle</a></p>
  </section>
}
