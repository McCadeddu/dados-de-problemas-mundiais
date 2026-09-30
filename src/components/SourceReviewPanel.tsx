import { REVIEW_DATE, SOURCE_REVIEWS } from '../lib/sourceReview'

export function SourceReviewPanel({ themeId }: { themeId: string }) {
  const review = SOURCE_REVIEWS.find(r => r.themeId === themeId)
  if (!review) return null
  return <section className="panel national-data source-review" aria-label="Controle de fontes por problemática">
    <div className="panel__header"><div><h3>Fontes nacionais, regionais e mundiais</h3><p>Revisão documental de {REVIEW_DATE.split('-').reverse().join('/')} · {review.name}</p></div></div>
    <p><strong>Regra de comparação:</strong> {review.rule}</p>
    <details><summary>Ver fontes, verificação e situação de integração</summary>
      <p>Esta revisão usa o Brasil como referência nacional e recortes regionais explicitados abaixo. Não certifica todos os países ou continentes. Fonte localizada não significa dados importados ou comparação aprovada.</p>
      <div className="national-data__table"><table><caption>Evidências por escala — {review.name}</caption><thead><tr><th scope="col">Escala e fonte</th><th scope="col">O que foi verificado</th><th scope="col">Uso no painel</th></tr></thead><tbody>{review.sources.map(s => <tr key={s.url}><th scope="row">{s.scale}<br /><a href={s.url} target="_blank" rel="noreferrer">{s.name}</a></th><td>{s.evidence}</td><td>{s.use}</td></tr>)}</tbody></table></div>
      <p className="meta">Uma fonte nacional pode alimentar uma fonte mundial: coincidência dos valores não constitui validação independente. Datas de publicação, coleta e referência não são equivalentes.</p>
    </details>
    <p className="national-data__next-step"><strong>Melhoria ainda necessária:</strong> {review.next}</p>
  </section>
}
