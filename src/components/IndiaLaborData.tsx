import type { NationalData } from '../types'

const monthLabel = (period: string) => `${period.slice(5)}/${period.slice(0, 4)}`
const percentage = (value: number) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

export function IndiaLaborData({ data }: { data: NonNullable<NationalData['indiaUnemployment']> }) {
  const latest = data.points.at(-1)
  return <article className="national-data__indicator">
    <h4>Desemprego mensal — Índia (MoSPI)</h4>
    {latest && <p className="national-data__value">{percentage(latest.value)} <small>· mês de referência: {monthLabel(latest.period)}</small></p>}
    <p>A taxa mede pessoas desempregadas de 15 anos ou mais como percentual da força de trabalho, que reúne ocupados e desempregados. O recorte da pesquisa domiciliar PLFS abrange o país, áreas rurais e urbanas e o total de pessoas.</p>
    <p>A situação semanal corrente (CWS) considera os sete dias anteriores à entrevista. A definição de desemprego inclui quem não trabalhou nem uma hora nessa semana, mas procurou ou esteve disponível para trabalhar por pelo menos uma hora.</p>
    <p>Desemprego não mede informalidade, ausência de contribuição previdenciária nem trabalho forçado. Pessoas ocupadas podem enfrentar esses outros problemas.</p>
    <details><summary>Como interpretar este histórico</summary>
      <p>A série mensal começou em abril de 2025, após a reformulação amostral da PLFS. Não foi emendada às antigas séries trimestrais urbanas nem à medida anual de situação habitual, que usa referência de 365 dias.</p>
      <p>A API não identifica ajuste sazonal nem fornece incerteza amostral nesta consulta. As estimativas podem ser revistas; os relatórios da PLFS trazem medidas de precisão. Uma oscilação mensal isolada não demonstra tendência.</p>
      <p>Este complemento não substitui a série anual harmonizada da OIT. Diferenças de idade, período e definição impedem a comparação direta de taxas nacionais sem revisão. A série não entra automaticamente no cruzamento trabalho–migração; associação não prova causalidade.</p>
    </details>
    <details><summary>Ver histórico mensal do MoSPI ({data.points.length} meses)</summary>
      <div className="national-data__table"><table><caption>Desemprego na Índia: percentual da força de trabalho de 15 anos ou mais (CWS)</caption>
        <thead><tr><th scope="col">Mês</th><th scope="col">Valor</th></tr></thead>
        <tbody>{[...data.points].reverse().map((point) => <tr key={point.period}><td>{monthLabel(point.period)}</td><td>{percentage(point.value)}</td></tr>)}</tbody>
      </table></div>
      <p className="meta">Exibição com uma casa decimal. Valores recebidos preservados no JSON; ausências não são preenchidas com zero.</p>
    </details>
    <p className="meta">Fonte: <a href={data.sourceUrl}>MoSPI · PLFS, relatórios e precisão amostral</a> · <a href={data.requestUrl}>Consulta utilizada (JSON)</a> · <a href={data.methodologyUrl}>Metodologia</a> · <a href={data.accessPolicyUrl}>Política de acesso a dados agregados</a>.</p>
    <p className="meta">Coleta: {new Date(data.fetchedAt).toLocaleDateString('pt-BR')}. Última tentativa: {new Date(data.lastAttemptAt).toLocaleDateString('pt-BR')}. A API não informa a data de revisão dos valores. {data.cached && 'A última tentativa falhou; exibindo a coleta anterior.'}</p>
    <p className="meta">Dados agregados públicos do MoSPI. Seleção, tradução e apresentação pelo Mundialidade, sem endosso da instituição. <a href={`${import.meta.env.BASE_URL}data/national-data.json`} download>Baixar dados nacionais e proveniência (JSON)</a>.</p>
  </article>
}
