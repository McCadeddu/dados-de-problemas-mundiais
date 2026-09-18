import type { Indicator, LatestValue, Source } from '../types'

const denominatorByIndicator: Record<string, string> = {
  'uis-adult-illiteracy': 'população de 15 anos ou mais',
  'uis-youth-illiteracy': 'população de 15 a 24 anos',
  'ilo-unemployment': 'força de trabalho',
  'ilo-youth-unemployment': 'força de trabalho de 15 a 24 anos',
  'ilo-vulnerable-employment': 'emprego total',
  'ibge-state-no-pension': 'ocupados de 14 anos ou mais no 4º trimestre',
  'ibge-state-unemployment': 'força de trabalho estadual',
}

export function DataQualityPanel({ indicator, source, latest, coverageTotal, territoryLabel, generatedAt }: {
  indicator: Indicator
  source?: Source
  latest: LatestValue[]
  coverageTotal: number
  territoryLabel: string
  generatedAt: string
}) {
  const years = [...new Set(latest.map((item) => item.year))].sort((a, b) => a - b)
  const coveragePercent = coverageTotal ? Math.round((latest.length / coverageTotal) * 100) : 0
  const denominator = denominatorByIndicator[indicator.id] ?? `${territoryLabel} com observação publicada pela fonte`
  const missing = Math.max(coverageTotal - latest.length, 0)
  return <section className="panel data-quality" aria-label="Qualidade e comparabilidade do indicador">
    <div className="panel__header"><div><span>Qualidade e comparabilidade</span><h3>Como ler este indicador</h3><p>Metadados para avaliar cobertura e limites antes de comparar territórios.</p></div><strong className="badge">{coveragePercent}% coberto</strong></div>
    <div className="data-quality__grid">
      <article><span>Fonte</span><strong>{source?.name ?? 'Fonte não identificada'}</strong>{source && <p><a href={source.url} target="_blank" rel="noreferrer">dados</a> · <a href={source.methodologyUrl} target="_blank" rel="noreferrer">metodologia</a></p>}</article>
      <article><span>Denominador</span><strong>{denominator}</strong><p>Unidade exibida: {indicator.unit}.</p></article>
      <article><span>Período observado</span><strong>{years.length ? (years[0] === years.at(-1) ? years[0] : `${years[0]}–${years.at(-1)}`) : 'sem observações'}</strong><p>Último ano indicado pela fonte: {indicator.latestYear}.</p></article>
      <article><span>Cobertura territorial</span><strong>{latest.length} de {coverageTotal} {territoryLabel}</strong><p>{missing ? `${missing} sem último valor; ausência não é zero.` : 'Todos têm algum último valor disponível.'}</p></article>
    </div>
    <p className="meta">Arquivo processado em {new Date(generatedAt).toLocaleString('pt-BR')}. Comparações válidas exigem mesmo conceito, denominador, período e unidade; anos diferentes não formam automaticamente uma série conjunta.</p>
  </section>
}
