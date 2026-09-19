import { useId, useState } from 'react'
import type { Indicator, Source } from '../types'

const unitExplanations: Record<string, string> = {
  '%': 'Percentual: valor expresso em centésimos da base indicada na definição. Confira se a base é população, força de trabalho, ocupados ou domicílios. Passar de 10% para 12% significa aumentar 2 pontos percentuais.',
  'p.p.': 'Pontos percentuais: diferença entre dois percentuais. Por exemplo, 60% menos 40% são 20 pontos percentuais; a ordem da subtração está na definição.',
  pessoas: 'Número de pessoas ou registros abrangidos pela definição e pelo período da fonte. Uma contagem maior também pode refletir o tamanho do território; ela não é uma taxa.',
  'mil pessoas': 'Número expresso em milhares: um valor de 2 corresponde a 2.000 pessoas abrangidas pela definição.',
  'R$': 'Valor em reais. Confira na definição se é uma média por pessoa, o período de renda e o ano de referência dos preços.',
  horas: 'Tempo em horas. Se a definição compara dois grupos, o valor representa a diferença entre seus tempos, na ordem indicada.',
  focos: 'Contagem de detecções de focos ativos no período indicado pela fonte. A unidade descreve detecções, não hectares de área queimada.',
  'focos por 100 mil hab.': 'Contagem de focos dividida pela população residente e multiplicada por 100.000. Permite observar a contagem em relação ao tamanho da população.',
  'índice 0-1': 'Pontuação na escala de zero a um. Não é uma contagem de pessoas nem um percentual da população.',
  índice: 'Pontuação construída pela metodologia da fonte. Confira a escala antes de comparar com outro índice; não é um percentual da população.',
  score: 'Pontuação calculada pela fonte a partir de várias medidas. A escala e a composição dependem do indicador; não representa uma porcentagem de pessoas afetadas.',
}

export function IndicatorExplanation({ indicator, source }: { indicator: Indicator; source?: Source }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const interpretation = indicator.direction === 'higher-better'
    ? 'Na orientação adotada pelo painel, valores maiores indicam uma situação mais favorável nesta dimensão.'
    : indicator.direction === 'higher-worse'
      ? 'Na orientação adotada pelo painel, valores maiores indicam maior intensidade do problema nesta dimensão.'
      : 'Este indicador é descritivo: um valor maior não é classificado automaticamente como melhor ou pior.'

  return <div className="indicator-explanation">
    <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}>
      {open ? 'Fechar explicação do indicador' : 'O que é e o que mede?'}
    </button>
    <div id={id} hidden={!open} className="indicator-explanation__body">
      <h3>{indicator.name}</h3>
      <h4>O que é e o que mede</h4>
      <p>{indicator.description.trim() || 'A definição deste indicador ainda não foi disponibilizada. Consulte a metodologia da fonte antes de interpretar o valor.'}</p>
      <h4>Como ler a unidade: {indicator.unit}</h4>
      <p>{unitExplanations[indicator.unit] ?? 'A unidade deve ser interpretada conforme a definição e a metodologia da fonte.'}</p>
      <h4>Como interpretar</h4>
      <p>{interpretation} O indicador descreve apenas o aspecto definido acima; sozinho, não explica as causas do problema.</p>
      <p>Compare valores com o mesmo conceito, período e população de referência. Ausência de observação não significa valor zero.</p>
      {source && <p className="meta">Fonte: <a href={source.url} target="_blank" rel="noreferrer">{source.name}</a> · <a href={source.methodologyUrl} target="_blank" rel="noreferrer">Definições e metodologia</a></p>}
    </div>
  </div>
}
