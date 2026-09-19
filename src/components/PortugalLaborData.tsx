import type { NationalData } from '../types'

const quarterLabel = (period: string) => `${period.slice(-1)}º trimestre de ${period.slice(0, 4)}`
const percentage = (value: number | null) => value === null ? 'Sem observação' : `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

export function PortugalLaborData({ data }: { data: NonNullable<NationalData['portugalUnemployment']> }) {
  const latest = data.points.filter((point) => point.value !== null).at(-1)
  return <article className="national-data__indicator">
    <h4>Desemprego trimestral — Portugal (INE)</h4>
    {latest && <p className="national-data__value">{percentage(latest.value)} <small>· {quarterLabel(latest.period)}</small></p>}
    <p>Taxa de desemprego do Inquérito ao Emprego, série 2021, total de homens e mulheres residentes em Portugal. Mede pessoas desempregadas como percentual da população ativa, que reúne pessoas ocupadas e desempregadas; o recorte da série 2021 abrange 16 a 89 anos.</p>
    <p>São trimestres civis, não médias anuais. A API consultada não identifica o ajuste sazonal nos metadados. Este complemento não substitui a série anual harmonizada da OIT nem entra automaticamente na comparação trabalho–migração.</p>
    <p>As estimativas são amostrais e podem ser revistas. Variações trimestrais, isoladamente, não demonstram tendência nem relação causal.</p>
    <p><strong>Revisão documentada pelo INE:</strong> {data.sourceNote}</p>
    {latest && (latest.status || latest.comment) && <p>Sinalização do último valor: {latest.status || '—'} {latest.comment}</p>}
    <details><summary>Ver histórico trimestral e sinalizações ({data.points.length} trimestres)</summary>
      <div className="national-data__table"><table><caption>Desemprego em Portugal: percentual da população ativa</caption>
        <thead><tr><th scope="col">Trimestre</th><th scope="col">Valor</th><th scope="col">Sinalização INE</th><th scope="col">Observação da fonte</th></tr></thead>
        <tbody>{[...data.points].reverse().map((point) => <tr key={point.period}><td>{quarterLabel(point.period)}</td><td>{percentage(point.value)}</td><td>{point.status || '—'}</td><td>{point.comment || '—'}</td></tr>)}</tbody>
      </table></div>
      <p className="meta">Valores mantidos com uma casa decimal, conforme o INE. Sinalizações e descrições da fonte são preservadas. Ausências não são convertidas em zero.</p>
    </details>
    <p className="meta">Fonte: <a href={data.sourceUrl}>Instituto Nacional de Estatística · indicador 0012136</a>. <a href={data.methodologyUrl}>Metadados e revisão</a> · <a href="https://www.ine.pt/ine_novidades/BME_ago_2022/">Definição do recorte etário (INE, p. 8)</a> · <a href={data.licenseUrl}>Licença CC BY 4.0 no catálogo oficial</a> · <a href={data.requestUrl}>Consulta à API</a>.</p>
    <p className="meta">Atualização da fonte: {data.sourceUpdatedAt.split('-').reverse().join('/')}. Coleta: {new Date(data.fetchedAt).toLocaleDateString('pt-BR')}. Última tentativa: {new Date(data.lastAttemptAt).toLocaleDateString('pt-BR')}. {data.cached && 'A última tentativa falhou; exibindo a coleta anterior.'}</p>
    <p className="meta">Seleção e apresentação pelo Mundialidade, a partir de dados do INE, I.P. <a href={`${import.meta.env.BASE_URL}data/national-data.json`} download>Baixar dados nacionais e proveniência (JSON)</a>.</p>
  </article>
}
