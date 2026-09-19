import type { NationalData } from '../types'

const month = (period: string) => `${period.slice(5)}/${period.slice(0, 4)}`
const percentage = (value: number | null) => value === null ? 'Sem observação' : `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

export function AustraliaLaborData({ data }: { data: NonNullable<NationalData['australiaUnemployment']> }) {
  const latest = data.points.filter((point) => point.value !== null).at(-1)
  return <article className="national-data__indicator">
    <h4>Desemprego mensal — Austrália (ABS)</h4>
    {latest && <p className="national-data__value">{percentage(latest.value)} <small>· mês de referência: {month(latest.period)}</small></p>}
    <p>Percentual de pessoas desempregadas na força de trabalho civil de 15 anos ou mais, total de pessoas, Austrália. A força de trabalho reúne pessoas ocupadas e desempregadas. Pesquisa Labour Force Survey, com ajuste sazonal.</p>
    <p>Este complemento mensal acompanha a situação nacional. A comparação mundial e a análise trabalho–migração continuam usando a série anual harmonizada da OIT; os valores não são substituídos nem combinados automaticamente.</p>
    <p>Estimativas amostrais sujeitas a revisões. Uma variação de um mês não demonstra tendência nem causa. Consulte na metodologia as mudanças da pesquisa e a incerteza das estimativas.</p>
    {latest && (latest.status || latest.comment) && <p>Sinalização do último valor: {latest.status || '—'} {latest.comment}</p>}
    <details><summary>Ver histórico mensal e sinalizações ({data.points.length} meses)</summary>
      <div className="national-data__table"><table><caption>Desemprego na Austrália: percentual da força de trabalho, com ajuste sazonal</caption>
        <thead><tr><th scope="col">Mês de referência</th><th scope="col">Valor</th><th scope="col">Sinalização ABS</th><th scope="col">Observação da fonte</th></tr></thead>
        <tbody>{[...data.points].reverse().map((point) => <tr key={point.period}><td>{month(point.period)}</td><td>{percentage(point.value)}</td><td>{point.status || '—'}</td><td>{point.comment || '—'}</td></tr>)}</tbody>
      </table></div>
      <p className="meta">Exibição com uma casa decimal, conforme a precisão indicada pela ABS. O arquivo JSON preserva os valores recebidos da API e seus códigos de sinalização. Meses sem observação não são preenchidos com zero.</p>
    </details>
    <p className="meta">Fonte: <a href={data.sourceUrl}>Australian Bureau of Statistics · Labour Force, Australia</a>. <a href={data.methodologyUrl}>Metodologia</a> · <a href={data.licenseUrl}>Licença CC BY 4.0 e condições de reutilização</a> · <a href={data.requestUrl}>Consulta à API</a>.</p>
    <p className="meta">Coleta: {new Date(data.fetchedAt).toLocaleDateString('pt-BR')}. Última tentativa: {new Date(data.lastAttemptAt).toLocaleDateString('pt-BR')}. {data.cached && 'A última tentativa falhou; exibindo a coleta anterior.'}</p>
    <p className="meta">© Commonwealth of Australia. Seleção, tradução e apresentação pelo Mundialidade; valores da API preservados no arquivo. <a href={`${import.meta.env.BASE_URL}data/national-data.json`} download>Baixar dados nacionais e proveniência (JSON)</a>.</p>
  </article>
}
