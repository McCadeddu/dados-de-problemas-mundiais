import type { SouthAfricaPension } from '../types'
import { formatValue } from '../lib/dashboard'

export function SouthAfricaPensionData({ data }: { data: SouthAfricaPension }) {
  const latest = data.points.at(-1)
  return <article className="national-data__indicator" aria-label="Contribuição patronal para aposentadoria na África do Sul">
    <h4>Contribuição do empregador para aposentadoria — África do Sul</h4>
    {latest && <>
      <p className="national-data__value">{formatValue(latest.bothSexes, '%')} <small>· empregados, ambos os sexos · {latest.year}</small></p>
      <p>Homens: <strong>{formatValue(latest.men, '%')}</strong> · Mulheres: <strong>{formatValue(latest.women, '%')}</strong>. Cada percentual usa os empregados do respectivo sexo como base; não some os dois valores.</p>
    </>}
    <p>Percentual de empregados de 15 a 64 anos cujo empregador contribui para um fundo de pensão ou aposentadoria em seu nome. O denominador são os empregados abrangidos pela QLFS; trabalhadores por conta própria e outros ocupados sem vínculo de emprego não compõem essa base.</p>
    <p>O relatório anual reúne os resultados dos quatro trimestres. Preservamos os percentuais publicados, incluindo o total calculado pela Stats SA; ele não é a média simples dos percentuais de homens e mulheres.</p>
    <p>Este indicador mede uma forma específica de proteção ligada ao emprego. Não informa o valor da futura aposentadoria nem toda a cobertura previdenciária. O complemento até 100% não deve ser interpretado como ausência de qualquer proteção social. A definição difere do indicador brasileiro de ocupados sem contribuição previdenciária.</p>
    <details><summary>Ver histórico de contribuição patronal ({data.points.length} anos)</summary>
      <div className="national-data__table"><table><caption>Empregados com contribuição do empregador para aposentadoria (%) — Stats SA, tabela {data.table}</caption>
        <thead><tr><th scope="col">Ano</th><th scope="col">Ambos os sexos</th><th scope="col">Homens</th><th scope="col">Mulheres</th></tr></thead>
        <tbody>{[...data.points].reverse().map((point) => <tr key={point.year}><td>{point.year}</td><td>{formatValue(point.bothSexes, '%')}</td><td>{formatValue(point.men, '%')}</td><td>{formatValue(point.women, '%')}</td></tr>)}</tbody>
      </table></div>
    </details>
    <details><summary>Limites de comparação e atualização</summary>
      <p>São estimativas amostrais. As entrevistas passaram a ser telefônicas durante a pandemia; do segundo trimestre de 2020 ao segundo trimestre de 2021, a coleta não cobriu a amostra completa e exigiu ajustes de ponderação. Compare esse período com cautela. Variações isoladas não demonstram causalidade ou significância estatística.</p>
      <p>A edição utilizada cobre 2019–2024. Mudanças de conceitos na QLFS a partir de 2025 exigem revisão antes de acrescentar novos anos. Este complemento nacional não entra nos rankings mundiais nem no cruzamento trabalho–migração.</p>
    </details>
    <p className="meta">Fonte: <a href={data.sourceUrl}>Statistics South Africa · Labour Market Dynamics 2024</a> · <a href={`${data.documentUrl}#page=${data.pdfPage}`}>Tabela {data.table}, página {data.printedPage} (PDF)</a> · <a href={`${data.documentUrl}#page=15`}>Metodologia anual e ressalvas de coleta</a>.</p>
    <p className="meta">Publicado em {data.publishedAt.split('-').reverse().join('/')}. Edição conferida em {data.reviewedAt.split('-').reverse().join('/')}. Último ano observado: {latest?.year ?? 'sem observações'}. Não é uma coleta em tempo real; novas edições dependem de conferência.</p>
    <p className="meta">{data.license} Seleção, tradução e apresentação independentes pelo Mundialidade, sem endosso da Stats SA.</p>
    <p className="meta"><a href={`${import.meta.env.BASE_URL}data/south-africa-pension.csv`} download>Baixar histórico de contribuição patronal (CSV)</a> · <a href={`${import.meta.env.BASE_URL}data/national-data.json`} download>Baixar valores e proveniência da edição (JSON)</a></p>
  </article>
}
