import type { NationalData } from '../types'

const monthLabel = (period: string) => `${period.slice(5)}/${period.slice(0, 4)}`
const percentage = (value: number | null) => value === null ? 'Sem observação' : `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

export function MexicoLaborData({ data }: { data: NonNullable<NationalData['mexicoUnemployment']> }) {
  const latest = data.points.filter((point) => point.value !== null).at(-1)
  return <article className="national-data__indicator">
    <h4>Desemprego mensal — México (INEGI)</h4>
    {latest && <p className="national-data__value">{percentage(latest.value)} <small>· mês de referência: {monthLabel(latest.period)}</small></p>}
    <p>Pessoas de 15 anos ou mais sem ocupação e em busca ativa de trabalho, como percentual da população economicamente ativa (ocupados e desocupados). Abrange homens e mulheres no México, segundo a pesquisa domiciliar ENOE.</p>
    <p>Série mensal original, sem ajuste sazonal. Oscilações do calendário podem afetar os valores. Desemprego não mede informalidade, ausência de contribuição previdenciária ou trabalho forçado; uma taxa baixa não significa que todos tenham trabalho adequado.</p>
    <p>O histórico começa em janeiro de 2023, quando a ENOE foi retomada. As pesquisas ETOE e ENOE Nova Edição, utilizadas entre 2020 e 2022, não foram unidas a esta série. As estimativas são amostrais e podem ser revistas.</p>
    <p>Ressalva de coleta: após o furacão Otis, Guerrero teve cobertura incompleta em outubro de 2023, nenhuma informação em novembro e resposta próxima de 50% em dezembro. Consulte as notas originais antes de interpretar esses meses.</p>
    <p>Este complemento nacional não substitui a série anual harmonizada da OIT nem entra automaticamente na comparação trabalho–migração. Uma associação entre indicadores não demonstra causalidade.</p>
    <details><summary>Ver histórico mensal do INEGI ({data.points.length} meses)</summary>
      <div className="national-data__table"><table><caption>Desemprego no México: percentual da população economicamente ativa de 15 anos ou mais, sem ajuste sazonal</caption>
        <thead><tr><th scope="col">Mês</th><th scope="col">Valor</th><th scope="col">Disponibilidade</th></tr></thead>
        <tbody>{[...data.points].reverse().map((point) => <tr key={point.period}><td>{monthLabel(point.period)}</td><td>{percentage(point.value)}</td><td>{point.status === 'ND' ? 'Não disponível (ND)' : 'Publicado'}</td></tr>)}</tbody>
      </table></div>
      <p className="meta">ND = não disponível; lacunas não viram zero. A tela arredonda para uma casa decimal e o arquivo de dados preserva a precisão recebida. As cores de precisão amostral da planilha não são reproduzidas nesta tabela: consulte os <a href={data.precisionUrl}>indicadores de precisão do INEGI</a>, incluindo coeficientes de variação e intervalos de confiança.</p>
    </details>
    <details><summary>Ver notas originais da planilha (em espanhol)</summary>{data.sourceNotes.map((note, i) => <p className="meta" key={i}>{note}</p>)}</details>
    <p className="meta">Fonte: <a href={data.sourceUrl}>INEGI · ENOE</a> · <a href={data.requestUrl}>Planilha oficial utilizada (XLSX)</a> · <a href={data.methodologyUrl}>Notas sobre a pesquisa</a> · <a href={data.licenseUrl}>Condições de reutilização</a>.</p>
    <p className="meta">Coleta: {new Date(data.fetchedAt).toLocaleDateString('pt-BR')}. Última tentativa: {new Date(data.lastAttemptAt).toLocaleDateString('pt-BR')}. {data.cached && 'A última tentativa falhou; exibindo a coleta anterior.'}</p>
    <p className="meta">Dados: INEGI. Seleção desde 2023, tradução e arredondamento de exibição pelo Mundialidade, sem endosso da instituição. O histórico é substituído em conjunto a cada coleta válida.</p>
  </article>
}
