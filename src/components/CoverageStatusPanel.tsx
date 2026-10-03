import { useEffect, useState } from 'react'
import type { DashboardData } from '../types'
import { COVERAGE_SCOPES, collectionStatus, scopeCoverage, type CoverageReport } from '../lib/coverageStatus'
import { SOURCE_REVIEWS } from '../lib/sourceReview'
import { supportsTotalPopulationAverage } from '../lib/dashboard'

function date(value?: string) {
  if (!value) return 'Não informada'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export function CoverageStatusPanel({ dashboard, themeId }: { dashboard: DashboardData; themeId: string }) {
  const [report, setReport] = useState<CoverageReport | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [filter, setFilter] = useState('theme')
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}data/coverage-status.json`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Diagnóstico indisponível'); return response.json() as Promise<CoverageReport> })
      .then(result => {
        if (!result || typeof result.generatedAt !== 'string' || typeof result.catalogGeneratedAt !== 'string' || !Array.isArray(result.datasets)
          || result.datasets.some(d => !d || typeof d.id !== 'string' || typeof d.name !== 'string' || !Array.isArray(d.territories))) throw new Error('Diagnóstico inválido')
        if (!controller.signal.aborted) { setReport(result); setError(false) }
      })
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [attempt])

  const mismatch = report && report.catalogGeneratedAt !== dashboard.generatedAt
  const visible = report?.datasets.filter(d => filter === 'all' || (filter === 'cached' ? d.cached === true : d.themeId === themeId)) ?? []
  const review = SOURCE_REVIEWS.find(r => r.themeId === themeId)
  return <section className="panel national-data coverage-status" aria-label="Matriz de cobertura e status dos dados">
    <div className="panel__header"><div><h3>Cobertura e atualização dos dados</h3><p>Saiba o que está integrado em cada âmbito e quais conjuntos usam uma coleta anterior.</p></div></div>
    {error ? <div role="alert"><p>Não foi possível carregar o diagnóstico de cobertura. Os dados da análise continuam disponíveis.</p><button className="text-button" onClick={() => { setError(false); setAttempt(a => a + 1) }}>Tentar carregar diagnóstico novamente</button></div>
      : !report ? <p role="status">Carregando diagnóstico de cobertura…</p>
      : mismatch ? <p role="alert">O diagnóstico pertence a outra versão da base. A matriz não será exibida até que os arquivos sejam atualizados em conjunto.</p>
      : <>
        <p>{report.datasets.filter(d => d.cached === true).length} conjuntos com cache declarado. Data de coleta ausente permanece como “não informada”; processamento do arquivo não comprova nova consulta à fonte.</p>
        <details><summary>Ver matriz territorial, fontes e datas de atualização</summary>
          <p>A cobertura abaixo considera todo o histórico disponível, com pelo menos uma observação numérica válida por território. Não representa cobertura em um mesmo ano nem certificação de comparabilidade.</p>
          <div className="national-data__table"><table><caption>Dados integrados por problemática e âmbito territorial</caption><thead><tr><th scope="col">Problemática</th>{COVERAGE_SCOPES.map(scope => <th key={scope.id} scope="col">{scope.name}</th>)}<th scope="col">Continentes do mapa</th></tr></thead><tbody>
            {dashboard.themes.map(theme => <tr key={theme.id} className={theme.id === themeId ? 'coverage-status__current' : undefined}><th scope="row">{theme.name}{theme.id === themeId && <small> Tema em análise</small>}</th>
              {COVERAGE_SCOPES.map(scope => { const coverage = scopeCoverage(report.datasets, theme.id, scope.id); return <td key={scope.id}>{coverage.datasets ? <><strong>{coverage.datasets} conjunto(s)</strong><br />{coverage.territories} território(s) com algum dado</> : 'Sem dados integrados'}{coverage.registered > coverage.datasets && <small> {coverage.registered - coverage.datasets} conjunto(s) sem observações ou arquivo disponível</small>}</td> })}
              <td>{dashboard.indicators.some(i => i.themeId === theme.id && supportsTotalPopulationAverage(i)) ? 'Estimativas dos países cobertos para acesso à água; não são agregados oficiais.' : 'Recorte dos países; sem agregado continental integrado.'}</td>
            </tr>)}
          </tbody></table></div>
          <p className="meta">Regiões oficiais podem ter composição diferente dos continentes. UFs e Regiões Geográficas Imediatas são subdivisões brasileiras. “Sem dados integrados” não significa ausência do problema ou de uma fonte pública.</p>
          <div className="controls"><label>Conjuntos a consultar<select value={filter} onChange={event => setFilter(event.target.value)}><option value="theme">Problemática atual</option><option value="cached">Todos os conjuntos com cache declarado</option><option value="all">Todos os conjuntos</option></select></label></div>
          <p role="status">{visible.length} conjuntos neste filtro.</p>
          <div className="national-data__table"><table><caption>Referência dos dados e operação da coleta</caption><thead><tr><th scope="col">Conjunto e origem</th><th scope="col">Período observado</th><th scope="col">Situação registrada</th><th scope="col">Publicação/atualização informada</th><th scope="col">Coleta dos dados</th><th scope="col">Última tentativa</th><th scope="col">Revisão documental</th><th scope="col">Processamento da base</th></tr></thead><tbody>
            {visible.map(dataset => <tr key={dataset.id}><th scope="row">{dataset.sourceUrl ? <a href={dataset.sourceUrl}>{dataset.name}</a> : dataset.name}<small>{COVERAGE_SCOPES.find(s => s.id === dataset.scope)?.name}</small><a href={`${import.meta.env.BASE_URL}data/${dataset.file}`} download>Baixar arquivo</a></th><td>{dataset.firstPeriod ? dataset.firstPeriod === dataset.lastPeriod ? dataset.firstPeriod : `${dataset.firstPeriod}–${dataset.lastPeriod}` : 'Sem observações válidas'}</td><td>{collectionStatus(dataset)}{dataset.available && !dataset.territories.length && <small>Sem observações válidas</small>}</td><td>{date(dataset.sourceUpdatedAt)}</td><td>{date(dataset.fetchedAt)}</td><td>{date(dataset.lastAttemptAt)}</td><td>{date(dataset.reviewedAt)}</td><td>{date(dataset.processedAt)}</td></tr>)}
          </tbody></table></div>
          {!visible.length && <p>Nenhum conjunto corresponde a este filtro.</p>}
          <p>O status descreve os arquivos publicados. Não verifica a disponibilidade da instituição neste instante. Atualização diária da coleta não altera a periodicidade das pesquisas.</p>
          {review && <details><summary>Referências documentais da problemática: {review.sources.length} fontes</summary><p>Estas referências não são contadas como novos conjuntos integrados. A descrição informa o uso e as lacunas de cada fonte.</p><ul>{review.sources.map(source => <li key={source.url}><a href={source.url}>{source.name}</a> · {source.scale}<p>{source.use}</p></li>)}</ul><p><strong>Próxima melhoria:</strong> {review.next}</p></details>}
          <p className="meta">Diagnóstico gerado em {date(report.generatedAt)}. <a href={`${import.meta.env.BASE_URL}data/coverage-status.json`} download>Baixar matriz e metadados (JSON)</a></p>
        </details>
      </>}
  </section>
}
