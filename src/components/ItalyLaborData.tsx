import type { NationalData } from '../types'

const monthLabel = (period: string) => `${period.slice(5)}/${period.slice(0, 4)}`
const percentage = (value: number | null) => value === null ? 'Sem observação' : `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

export function ItalyLaborData({ data }: { data: NonNullable<NationalData['italyUnemployment']> }) {
  const latest = data.points.filter((point) => point.value !== null).at(-1)
  return <article className="national-data__indicator">
    <h4>Desemprego mensal — Itália (Istat)</h4>
    {latest && <p className="national-data__value">{percentage(latest.value)} <small>· mês de referência: {monthLabel(latest.period)}</small></p>}
    <p>Pessoas desempregadas de 15 a 74 anos como percentual da força de trabalho dessa faixa etária (ocupados e desempregados), total de homens e mulheres na Itália. A definição exige procura ativa e disponibilidade para trabalhar, ou início de um trabalho nas condições previstas pela pesquisa.</p>
    <p>Série mensal com ajuste sazonal: o Istat trata oscilações recorrentes do calendário para facilitar a leitura da evolução. As estimativas são amostrais e podem ser revistas, inclusive em meses anteriores.</p>
    <p>Este complemento nacional não substitui a série anual harmonizada da OIT nem entra automaticamente na comparação trabalho–migração. Uma mudança mensal, isoladamente, não demonstra tendência nem causalidade.</p>
    <p className="meta">Todos os meses pertencem à mesma edição do Istat: {data.sourceUpdatedAt.split('-').reverse().join('/')} ({data.edition}). O histórico é atualizado em conjunto para evitar misturar revisões diferentes.</p>
    {latest && (latest.status || latest.comment) && <p>Sinalização do último valor: {latest.status || '—'} {latest.comment}</p>}
    <details><summary>Ver histórico mensal e sinalizações do Istat ({data.points.length} meses)</summary>
      <div className="national-data__table"><table><caption>Desemprego na Itália: percentual da força de trabalho de 15 a 74 anos, com ajuste sazonal</caption>
        <thead><tr><th scope="col">Mês</th><th scope="col">Valor</th><th scope="col">Sinalização Istat</th><th scope="col">Códigos de notas da fonte</th></tr></thead>
        <tbody>{[...data.points].reverse().map((point) => <tr key={point.period}><td>{monthLabel(point.period)}</td><td>{percentage(point.value)}</td><td>{point.status || '—'}</td><td>{point.comment || '—'}</td></tr>)}</tbody>
      </table></div>
      <p className="meta">p = provisório; r = revisado; b = quebra de série; e = estimativa. Outros códigos e notas devem ser consultados na fonte. Ausência de sinalização não garante valor definitivo. Lacunas não viram zero. A tela arredonda para uma casa decimal; o arquivo de dados preserva a precisão recebida.</p>
    </details>
    <p className="meta">Fonte: <a href={data.sourceUrl}>IstatData · conjunto 151_874</a> · <a href={data.requestUrl}>Consulta utilizada (CSV)</a> · <a href={data.methodologyUrl}>Metodologia consultada, pp. 8–10</a> · <a href={data.licenseUrl}>Licença CC BY 4.0 e condições</a>.</p>
    <p className="meta">Coleta: {new Date(data.fetchedAt).toLocaleDateString('pt-BR')}. Última tentativa: {new Date(data.lastAttemptAt).toLocaleDateString('pt-BR')}. {data.cached && 'A última tentativa falhou; exibindo a coleta anterior.'}</p>
    <p className="meta">Dados: Istat. Seleção, tradução e arredondamento de exibição pelo Mundialidade, sem endosso da instituição.</p>
  </article>
}
