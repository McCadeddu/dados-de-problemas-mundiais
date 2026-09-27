import type { DashboardData, Indicator } from '../types'
import { aggregationExplanation } from '../lib/dashboard'

export function ThemeCoveragePanel({ title, indicators, latest }: { title: string; indicators: Indicator[]; latest: DashboardData['latest'] }) {
  return <section className="panel">
    <div className="panel__header"><div><h3>{title}</h3><p>Cobertura dos dados nacionais disponíveis. Estes cartões não são totais nem médias mundiais.</p></div></div>
    <div className="hunger-water-panel__grid">{indicators.map(indicator => {
      const rows = latest.filter(row => row.indicatorId === indicator.id && row.geographyType === 'country' && Number.isFinite(row.value))
      const years = rows.map(row => row.year)
      return <article key={indicator.id}><h4>{indicator.name}</h4><strong>{rows.length} países e territórios</strong><p>{years.length ? `Anos dos últimos dados: ${Math.min(...years)}–${Math.max(...years)}.` : 'Sem observações disponíveis.'}</p><p>{aggregationExplanation(indicator)}</p></article>
    })}</div>
  </section>
}
