import type { NationalData } from '../types'

export function PortugalBenefitsData({ data }: { data: NonNullable<NationalData['portugalBenefits']> }) {
  const latest = data.points.filter(p => p.value !== null).at(-1)
  return <article className="national-data__indicator">
    <h4>Subsídios de desemprego — Portugal</h4>
    {latest && <p className="national-data__value">{latest.value!.toLocaleString('pt-BR')} <small>· {latest.period} · contagem por subsídio</small></p>}
    <p>Contagem anual de beneficiários de subsídios de desemprego da Segurança Social, total de homens e mulheres em Portugal. Fonte: Instituto de Informática, publicada pelo INE.</p>
    <p><strong>Uma pessoa pode aparecer mais de uma vez:</strong> o INE conta cada beneficiário tantas vezes quantos os subsídios recebidos. O total não representa pessoas únicas nem percentual de desempregados protegidos.</p>
    <p>Este indicador descreve o alcance administrativo dos subsídios. Sua variação depende também do desemprego, das regras de acesso e dos tipos de benefício; não permite concluir, isoladamente, melhora ou piora da proteção social. Não é dividido pela estimativa trimestral de desemprego nem incluído no ranking internacional.</p>
    <p><strong>Nota da fonte:</strong> {data.sourceNote}</p>
    {latest && (latest.status || latest.comment) && <p>Sinalização do último valor: {latest.status || '—'} {latest.comment}</p>}
    <details><summary>Ver histórico dos subsídios ({data.points.length} anos)</summary>
      <div className="national-data__table"><table><caption>Portugal: beneficiários contados por subsídio recebido</caption>
        <thead><tr><th scope="col">Ano</th><th scope="col">Contagem</th><th scope="col">Sinalização INE</th><th scope="col">Observação</th></tr></thead>
        <tbody>{[...data.points].reverse().map(p => <tr key={p.period}><td>{p.period}</td><td>{p.value === null ? 'Sem observação' : p.value.toLocaleString('pt-BR')}</td><td>{p.status || '—'}</td><td>{p.comment || '—'}</td></tr>)}</tbody>
      </table></div>
    </details>
    <p className="meta"><a href={data.sourceUrl}>INE · indicador 0004348</a> · <a href={data.methodologyUrl}>Metadados e definição</a> · <a href={data.licenseUrl}>Licença CC BY 4.0 no catálogo oficial</a> · <a href={data.requestUrl}>Consulta à API</a>.</p>
    <p className="meta">Atualização da fonte: {data.sourceUpdatedAt.split('-').reverse().join('/')}. Coleta: {new Date(data.fetchedAt).toLocaleDateString('pt-BR')}. Última tentativa: {new Date(data.lastAttemptAt).toLocaleDateString('pt-BR')}. {data.cached && 'A última tentativa falhou; exibindo a coleta anterior.'}</p>
    <p className="meta">Seleção e apresentação pelo Mundialidade, a partir do INE, I.P. e Instituto de Informática. <a href={`${import.meta.env.BASE_URL}data/portugal-benefits.csv`} download>Baixar histórico e proveniência (CSV)</a>.</p>
  </article>
}
