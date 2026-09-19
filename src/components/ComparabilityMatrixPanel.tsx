import { useState } from 'react'

const rows = [
  ['Desemprego', 'Pessoas sem trabalho, disponíveis e procurando trabalho', 'Percentual da força de trabalho; período anual; estimativa modelada da OIT/Banco Mundial', 'Comparável com o mesmo conceito e ano; não mede informalidade nem migração'],
  ['Emprego vulnerável', 'Trabalhadores por conta própria e familiares não remunerados', 'Percentual do emprego total; período anual; estimativa modelada', 'Comparável com cautela; não é sinônimo de pobreza ou trabalho escravo'],
  ['Ausência de contribuição', 'Ocupados sem contribuição previdenciária no recorte observado', 'Percentual de ocupados; Brasil/PNAD Contínua, 4º trimestre', 'Não comparar diretamente com a série global: denominador e cobertura diferem'],
  ['Trabalho forçado', 'Trabalho sob ameaça/coerção e sem liberdade efetiva', 'Estimativa de estoque/prevalência; referência global 2021', 'Não é taxa anual de desemprego; fonte e método são distintos'],
  ['Refugiados e solicitantes de asilo', 'Pessoas sob proteção internacional ou em pedido de proteção', 'Estoque no fim do ano; país de origem e país de acolhida', 'Comparar estoques separados de fluxos e de migração econômica'],
  ['Estoque de migrantes', 'Pessoas migrantes registradas ou estimadas como residentes', 'Estoque em uma data; definição depende da fonte nacional', 'Não equivale a refugiados, deslocados internos ou entradas no período'],
]

export function ComparabilityMatrixPanel() {
  const [showMethod, setShowMethod] = useState(false)

  return <section className="panel comparability-matrix" aria-label="Matriz de comparabilidade entre trabalho e migração">
    <div className="panel__header"><div><span>Matriz metodológica</span><h3>O que pode ser comparado?</h3><p>Antes de cruzar trabalho e migração, confira conceito, denominador, período e unidade de observação.</p></div><div className="comparability-matrix__actions"><strong className="badge">Sem causalidade</strong><button className="text-button comparability-matrix__toggle" type="button" aria-expanded={showMethod} aria-controls="comparability-method" onClick={() => setShowMethod((visible) => !visible)}>{showMethod ? 'Ocultar como cruzamos' : 'Como cruzamos os dados?'}</button></div></div>
    {showMethod && <div className="comparability-matrix__method" id="comparability-method">
      <h4>Como o cruzamento é feito</h4>
      <ol>
        <li><strong>Alinhamos a unidade:</strong> cada linha representa um país ou território em um ano específico.</li>
        <li><strong>Encontramos o mesmo país e ano</strong> nas séries de desemprego, emprego vulnerável, migração e população. Dados ausentes ficam fora do cálculo; não são tratados como zero.</li>
        <li><strong>Validamos os valores:</strong> taxas de trabalho devem estar entre 0% e 100%, a população deve ser positiva e a medida migratória não pode ser negativa.</li>
        <li><strong>Normalizamos a migração:</strong> contagens são divididas pela população do mesmo ano e apresentadas por mil habitantes, evitando que países maiores dominem apenas pelo tamanho.</li>
        <li><strong>Calculamos a associação:</strong> Pearson resume a relação linear e Spearman compara a ordem dos países, ambos dando o mesmo peso a cada território. Os resultados são descritivos e não provam causa.</li>
      </ol>
      <p className="meta">O botão de download no painel seguinte entrega exatamente as linhas usadas no cálculo, com população, denominador, códigos das fontes e data de processamento.</p>
    </div>}
    <div className="comparability-matrix__table"><table><caption>Desemprego, vulnerabilidade, contribuição e migração</caption><thead><tr><th>Medida</th><th>O que mede</th><th>Denominador e período</th><th>Regra de comparação</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th scope="row" key={cell}>{cell}</th> : <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
    <p className="meta">A matriz permite descrever associações em recortes alinhados. Ela não autoriza afirmar que desemprego causa migração, ou que migração causa desemprego.</p>
  </section>
}
