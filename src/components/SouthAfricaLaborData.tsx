import type { NationalData } from '../types'

const quarterLabel = (period: string) => `${period.slice(-1)}º trimestre de ${period.slice(0, 4)}`
const percentage = (value: number) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

export function SouthAfricaLaborData({ data }: { data: NonNullable<NationalData['southAfricaUnemployment']> }) {
  const latest = data.points.at(-1)
  return <article className="national-data__indicator">
    <h4>Desemprego trimestral — África do Sul (Stats SA)</h4>
    {latest && <p className="national-data__value">{percentage(latest.value)} <small>· {quarterLabel(latest.period)}</small></p>}
    <p>A taxa oficial de desemprego (LU1) mede pessoas desempregadas de 15 a 64 anos como percentual da força de trabalho, que reúne ocupados e desempregados. Abrange ambos os sexos na pesquisa domiciliar QLFS.</p>
    <p>A definição exige ausência de ocupação na semana de referência, procura de trabalho ou tentativa de iniciar negócio nas quatro semanas anteriores e disponibilidade. Também inclui pessoas disponíveis com trabalho ou negócio para começar em data definida.</p>
    <p>Pessoas desalentadas, que deixaram de procurar trabalho, ficam fora desta taxa. Desemprego não equivale a informalidade, ausência de contribuição previdenciária ou trabalho forçado.</p>
    <p>São taxas trimestrais publicadas pela Stats SA. A planilha não identifica ajuste sazonal. Este complemento nacional não substitui a série anual harmonizada da OIT nem entra automaticamente no cruzamento trabalho–migração.</p>
    <details><summary>Como interpretar este histórico</summary>
      <p>A pandemia mudou a coleta para entrevistas telefônicas em 2020, com cobertura limitada aos domicílios com telefone disponível e ajustes de ponderação. Oscilações desse período exigem cautela. <a href="https://www.statssa.gov.za/publications/P0211/P02112ndQuarter2020.pdf">Notas de coleta de 2020</a>.</p>
      <p>Em 2025, o questionário foi revisto. Segundo a Stats SA, a definição e a medição do desemprego permaneceram comparáveis; as definições de informalidade mudaram. Essa continuidade do desemprego não deve ser estendida automaticamente a outros indicadores.</p>
      <p>As estimativas são amostrais e podem ser revistas. Os intervalos de confiança estão no apêndice 2 do relatório; não foram incorporados à tabela abaixo. Variações isoladas não demonstram tendência ou causalidade.</p>
    </details>
    <details><summary>Ver histórico trimestral da Stats SA ({data.points.length} trimestres)</summary>
      <div className="national-data__table"><table><caption>Desemprego oficial na África do Sul: percentual da força de trabalho de 15 a 64 anos</caption>
        <thead><tr><th scope="col">Trimestre</th><th scope="col">Valor</th></tr></thead>
        <tbody>{[...data.points].reverse().map((point) => <tr key={point.period}><td>{quarterLabel(point.period)}</td><td>{percentage(point.value)}</td></tr>)}</tbody>
      </table></div>
      <p className="meta">Exibição com uma casa decimal. Valores recebidos preservados no JSON; ausências não são preenchidas com zero. Todo o histórico pertence à edição {data.edition}.</p>
    </details>
    <details><summary>Notas da planilha (em inglês)</summary>{data.sourceNotes.map((note, i) => <p className="meta" key={i}>{note}</p>)}</details>
    <p className="meta">Fonte: <a href={data.sourceUrl}>Statistics South Africa · QLFS</a> · <a href={data.requestUrl}>Planilha oficial utilizada (XLSX)</a> · <a href={data.methodologyUrl}>Relatório, definições e precisão amostral</a> · <a href={data.licenseUrl}>Condições de reutilização</a>.</p>
    <p className="meta">Publicação consultada: {data.sourceUpdatedAt.split('-').reverse().join('/')}. Coleta: {new Date(data.fetchedAt).toLocaleDateString('pt-BR')}. Última tentativa: {new Date(data.lastAttemptAt).toLocaleDateString('pt-BR')}. {data.cached && 'A última tentativa falhou; exibindo a coleta anterior.'}</p>
    <p className="meta">A coleta revisita a edição indicada; novas edições dependem de revisão metodológica antes da integração. © Statistics South Africa. Seleção, tradução e apresentação pelo Mundialidade, sem endosso da instituição. <a href={`${import.meta.env.BASE_URL}data/national-data.json`} download>Baixar dados nacionais e proveniência (JSON)</a>.</p>
  </article>
}
