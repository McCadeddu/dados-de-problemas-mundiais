import type { NationalData } from '../types'

const percentage = (value: number) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
const surveys: Record<number, string> = { 2004: 'PNAD', 2009: 'PNAD', 2013: 'PNAD', 2018: 'POF 2017–2018', 2023: 'PNAD Contínua', 2024: 'PNAD Contínua' }

export function BrazilFoodSecurityData({ data }: { data: NonNullable<NationalData['brazilFoodSecurity']> }) {
  const latest = data.points.at(-1)
  return <article className="national-data__indicator">
    <h4>Segurança alimentar — Brasil (IBGE/EBIA)</h4>
    {latest && <div className="national-data__food-cards">
      <p><strong>{percentage(latest.foodInsecurity)}</strong><span>domicílios com alguma insegurança alimentar</span></p>
      <p><strong>{percentage(latest.moderate)}</strong><span>domicílios com insegurança moderada</span></p>
      <p><strong>{percentage(latest.severe)}</strong><span>domicílios com insegurança grave</span></p>
    </div>}
    {latest && <p className="meta">Último ano disponível: {latest.year}. Os percentuais têm como denominador os domicílios particulares representados pela pesquisa.</p>}
    <p>A Escala Brasileira de Insegurança Alimentar (EBIA) identifica preocupação ou restrição no acesso regular a alimentos nos domicílios, com níveis leve, moderado e grave. “Alguma insegurança” inclui os três níveis; moderada e grave são partes desse total.</p>
    <p>O histórico reúne pesquisas diferentes: PNAD em 2004, 2009 e 2013; POF 2017–2018, registrada como 2018 no SIDRA; e PNAD Contínua em 2023 e 2024. Mudanças de pesquisa e de coleta exigem cautela ao interpretar a evolução.</p>
    <p>Este complemento nacional mede domicílios, enquanto o indicador mundial harmonizado mede a população. Por isso, os percentuais não devem ser comparados diretamente nem combinados como se fossem a mesma unidade.</p>
    <details><summary>Ver histórico do IBGE ({data.points.length} anos com observação)</summary>
      <div className="national-data__table"><table><caption>Segurança alimentar no Brasil: percentual de domicílios</caption>
        <thead><tr><th scope="col">Ano</th><th scope="col">Pesquisa</th><th scope="col">Alguma insegurança</th><th scope="col">Moderada</th><th scope="col">Grave</th></tr></thead>
        <tbody>{[...data.points].reverse().map((point) => <tr key={point.year}><td>{point.year}</td><td>{surveys[point.year] ?? 'Consultar fonte IBGE'}</td><td>{percentage(point.foodInsecurity)}</td><td>{percentage(point.moderate)}</td><td>{percentage(point.severe)}</td></tr>)}</tbody>
      </table></div>
      <p className="meta">Os anos são apresentados como publicados pelo IBGE; a série não interpola anos sem observação.</p>
    </details>
    <p>Este complemento cobre o Brasil. O painel estadual apresenta a insegurança alimentar pela PNAD Contínua, tabela 9552, a partir de 2023. Água e saneamento são indicadores distintos.</p>
    <p className="meta">Fonte: <a href={data.sourceUrl}>IBGE/SIDRA · tabela 6665</a> · <a href={data.requestUrl}>Consulta utilizada (JSON)</a> · <a href={data.methodologyUrl}>Metodologia PNAD Contínua e EBIA</a>.</p>
    <p className="meta">Coleta: {new Date(data.fetchedAt).toLocaleDateString('pt-BR')}. Última tentativa: {new Date(data.lastAttemptAt).toLocaleDateString('pt-BR')}. {data.cached && 'A última tentativa falhou; exibindo a coleta anterior.'}</p>
    <p className="meta">Dados agregados públicos do IBGE. Seleção, tradução e apresentação pelo Mundialidade. <a href={`${import.meta.env.BASE_URL}data/national-data.json`} download>Baixar dados nacionais e proveniência (JSON)</a>.</p>
  </article>
}
