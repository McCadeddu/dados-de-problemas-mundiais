import type { Series } from '../types'
import { DISCRIMINATION_METADATA, DISCRIMINATION_NOTE } from '../lib/discrimination'

export function DiscriminationNotesPanel({ series, year, loading }: { series: Series[]; year?: number; loading: boolean }) {
  const rows = series.flatMap(s => s.points.filter(p => p.year === year).map(p => ({ name: s.geographyName, code: s.geographyCode, ...p })))
    .sort((a, b) => a.name.localeCompare(b.name))
  return <section className="panel national-data" aria-label="Método e pesquisas de discriminação">
    <div className="panel__header"><div><h3>Discriminação social: confira a população e a pesquisa</h3><p>{DISCRIMINATION_NOTE}</p></div></div>
    <p>O mapa usa apenas dados nacionais classificados como C pela ONU e notas que confirmam os últimos 12 meses. Janelas diferentes, notas sem essa confirmação, estimativas e recortes de grupos ficam fora desta seleção. As categorias de motivos não são somadas.</p>
    <p>“Últimos 12 meses” é a janela lembrada na entrevista. O ano é o informado pela fonte, podendo representar uma pesquisa realizada há vários anos. As linhas do histórico ligam pesquisas disponíveis; não estimam os anos ausentes.</p>
    {loading ? <p role="status">Carregando notas das pesquisas…</p> : <details><summary>Ver pesquisas e notas de {year ?? 'ano não definido'}: {rows.length} {rows.length === 1 ? 'observação' : 'observações'}</summary>
      <div className="national-data__table"><table><caption>Observações do ano selecionado, sem substituir por outros anos</caption><thead><tr><th scope="col">País / território</th><th scope="col">Valor</th><th scope="col">Pesquisa e nota original da ONU</th></tr></thead><tbody>{rows.map(r => <tr key={r.code}><th scope="row">{r.name}</th><td>{r.value.toLocaleString('pt-BR')}%</td><td>{r.sourceFootnote || 'Nota não disponível'}</td></tr>)}</tbody></table></div>
      {!rows.length && <p>Não há observações elegíveis neste país ou recorte e ano. Ausência não é zero.</p>}
    </details>}
    <p>Não há agregado mundial, continental, UF ou região brasileira integrado para esta medida. O filtro continental seleciona países. A falta de dados do Brasil neste recorte da ONU não indica ausência de discriminação.</p>
    <p><a href={DISCRIMINATION_METADATA}>Definição oficial ODS 16.b.1</a> · <a href={`${import.meta.env.BASE_URL}data/un-discrimination-audit.json`} download>Seleção, edição e exclusões (JSON)</a> · <a href={`${import.meta.env.BASE_URL}data/un-discrimination-source.json`} download>Registros originais da seleção por motivos totais (JSON)</a></p>
  </section>
}
