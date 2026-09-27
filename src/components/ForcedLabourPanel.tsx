import { useState } from 'react'
import { forcedLabourEstimate as data } from '../lib/forcedLabour'

const integer = (value: number) => value.toLocaleString('pt-BR')
const decimal = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function ForcedLabourPanel() {
  const [measure, setMeasure] = useState<'rate' | 'count'>('rate')
  const regions = [...data.regions].sort((a, b) => measure === 'rate' ? b.perThousand - a.perThousand : b.countThousands - a.countThousands)
  return <section className="panel national-data" aria-label="Estimativa mundial de trabalho forçado">
    <div className="panel__header"><div><h3>Trabalho forçado: dimensão mundial e regional</h3><p>Referência: {data.referenceYear} · publicação: 2022 · OIT, Walk Free e OIM</p></div></div>
    <p><strong>{decimal(data.world.countThousands / 1000)} milhões de pessoas</strong> em trabalho forçado em um dia qualquer de 2021. A prevalência mundial estimada é de <strong>{decimal(data.world.perThousand)} por mil habitantes</strong>.</p>
    <p>São estimativas de pessoas submetidas a trabalho sob coerção, sem consentimento livre. Não representam novos casos anuais, resgates ou uma contagem em tempo real. Casamento forçado é outro componente do relatório e não está incluído nestes totais.</p>
    <details><summary>Explorar modalidades e regiões da OIT</summary>
      <div className="national-data__table"><table><caption>Modalidades de trabalho forçado — mundo, 2021</caption>
        <thead><tr><th scope="col">Modalidade</th><th scope="col">Estimativa (milhares de pessoas)</th></tr></thead>
        <tbody>{data.categories.map(row => <tr key={row.id}><th scope="row">{row.label}</th><td>{integer(row.countThousands)}</td></tr>)}</tbody>
        <tfoot><tr><th scope="row">Total mundial</th><td>{integer(data.world.countThousands)}</td></tr></tfoot>
      </table></div>
      <p>As três modalidades compõem o total mundial. Os valores abaixo usam as regiões do relatório da OIT, que não equivalem aos continentes do mapa e não mudam com seus filtros.</p>
      <div className="controls"><label>Ordenar regiões por <select value={measure} onChange={event => setMeasure(event.target.value as 'rate' | 'count')}><option value="rate">Prevalência por mil habitantes</option><option value="count">Número estimado de pessoas</option></select></label></div>
      <div className="national-data__table"><table><caption>Regiões OIT — 2021, ordem decrescente de {measure === 'rate' ? 'prevalência' : 'número estimado'}</caption>
        <thead><tr><th scope="col">Região do relatório</th><th scope="col">Estimativa (milhares de pessoas)</th><th scope="col">Pessoas por 1.000 habitantes</th></tr></thead>
        <tbody>{regions.map(row => <tr key={row.id}><th scope="row">{row.label}</th><td>{integer(row.countThousands)}</td><td>{decimal(row.perThousand)}</td></tr>)}</tbody>
      </table></div>
      <p>O número estimado depende também do tamanho da população. A prevalência usa toda a população da região como denominador, não apenas a força de trabalho. A Ásia e o Pacífico têm o maior total; os Estados Árabes têm a maior taxa nesta edição.</p>
      <p className="meta">As tabelas preservam a unidade original: milhares de pessoas; por exemplo, 886 significa aproximadamente 886 mil pessoas. São estimativas arredondadas, não contagens individuais exatas. As taxas publicadas não são recalculadas com a população atual.</p>
      <p>Parte da coleta antecede a pandemia, cujos efeitos podem estar refletidos apenas parcialmente. Estes resultados não permitem estimar a situação de um país específico. Registros de fiscalização medem ocorrências detectadas e exigem apresentação separada.</p>
      <p><a href={`${import.meta.env.BASE_URL}data/forced-labour-2021.csv`} download>Baixar estimativas e proveniência (CSV)</a> · <a href={`${import.meta.env.BASE_URL}data/forced-labour-2021.json`} download>Baixar edição revisada (JSON)</a></p>
      <p className="meta"><a href={`${data.documentUrl}#page=26`}>Relatório original · tabelas 1 e 2, páginas 17–18 (PDF 26–27)</a>. Metodologia no anexo, página 109. Edição conferida em {data.reviewedAt.split('-').reverse().join('/')}; esta data não altera o ano dos dados.</p>
      <p className="meta">Fonte e direitos: {data.authors}, 2022 · <a href={data.licenseUrl}>{data.license}</a>. {data.adaptationNotice}</p>
    </details>
  </section>
}
