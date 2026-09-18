import type { DashboardData } from '../types'

type AlignedRow = {
  countryCode: string
  countryName: string
  year: number
  unemployment: number
  vulnerableEmployment: number
  refugeesPerThousand: number
  refugees: number
}

function pointMap(series: { points?: Array<{ year: number; value: number }> } | undefined) {
  return new Map((series?.points ?? []).map((point) => [point.year, point.value]))
}

function correlation(rows: AlignedRow[], left: (row: AlignedRow) => number, right: (row: AlignedRow) => number) {
  if (rows.length < 3) return null
  const x = rows.map(left)
  const y = rows.map(right)
  const meanX = x.reduce((sum, value) => sum + value, 0) / x.length
  const meanY = y.reduce((sum, value) => sum + value, 0) / y.length
  const numerator = x.reduce((sum, value, index) => sum + ((value - meanX) * (y[index] - meanY)), 0)
  const denominator = Math.sqrt(x.reduce((sum, value) => sum + ((value - meanX) ** 2), 0) * y.reduce((sum, value) => sum + ((value - meanY) ** 2), 0))
  return denominator === 0 ? null : numerator / denominator
}

function downloadAlignedRows(rows: AlignedRow[]) {
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
  const output = [
    'codigo_pais,pais,ano,desemprego_pct,emprego_vulneravel_pct,refugiados_acolhidos_por_1000,refugiados_acolhidos',
    ...rows.map((row) => [row.countryCode, row.countryName, row.year, row.unemployment, row.vulnerableEmployment, row.refugeesPerThousand, row.refugees].map(escape).join(',')),
  ].join('\n')
  const blob = new Blob([`\ufeff${output}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'trabalho-migracao-pais-ano-alinhado.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

export function WorkMigrationComparisonPanel({ data }: { data: DashboardData }) {
  const unemployment = new Map(data.series.filter((series) => series.indicatorId === 'ilo-unemployment').map((series) => [series.geographyCode, pointMap(series)]))
  const vulnerable = new Map(data.series.filter((series) => series.indicatorId === 'ilo-vulnerable-employment').map((series) => [series.geographyCode, pointMap(series)]))
  const refugees = new Map(data.series.filter((series) => series.indicatorId === 'unhcr-refugees-hosted').map((series) => [series.geographyCode, pointMap(series)]))
  const population = new Map(data.countryPopulation.map((series) => [series.geographyCode, pointMap(series)]))
  const rows: AlignedRow[] = []
  for (const country of data.countries) {
    const unemploymentPoints = unemployment.get(country.code)
    const vulnerablePoints = vulnerable.get(country.code)
    const refugeePoints = refugees.get(country.code)
    const populationPoints = population.get(country.code)
    if (!unemploymentPoints || !vulnerablePoints || !refugeePoints || !populationPoints) continue
    for (const year of unemploymentPoints.keys()) {
      const unemploymentValue = unemploymentPoints.get(year)
      const vulnerableValue = vulnerablePoints.get(year)
      const refugeeValue = refugeePoints.get(year)
      const populationValue = populationPoints.get(year)
      if (unemploymentValue === undefined || vulnerableValue === undefined || refugeeValue === undefined || !populationValue) continue
      rows.push({ countryCode: country.code, countryName: country.name, year, unemployment: unemploymentValue, vulnerableEmployment: vulnerableValue, refugeesPerThousand: (refugeeValue / populationValue) * 1000, refugees: refugeeValue })
    }
  }
  const latestByCountry = [...new Map(rows.map((row) => [row.countryCode, row])).values()].sort((a, b) => b.refugeesPerThousand - a.refugeesPerThousand).slice(0, 12)
  const unemploymentCorrelation = correlation(rows, (row) => row.unemployment, (row) => row.refugeesPerThousand)
  const vulnerableCorrelation = correlation(rows, (row) => row.vulnerableEmployment, (row) => row.refugeesPerThousand)
  const formatCorrelation = (value: number | null) => value === null ? 'indisponível' : value.toFixed(2)
  return <section className="panel work-migration-comparison" aria-label="Comparação descritiva entre trabalho e migração">
    <div className="panel__header"><div><span>Teste descritivo</span><h3>Trabalho e migração no mesmo recorte</h3><p>Refugiados acolhidos são apresentados por mil habitantes; trabalho e migração só entram quando país, ano e população estão alinhados.</p></div><div className="work-migration-comparison__actions"><strong className="badge">Sem causalidade</strong><button className="export-button" onClick={() => downloadAlignedRows(rows)} disabled={!rows.length}>Baixar CSV alinhado</button></div></div>
    {rows.length ? <>
      <div className="work-migration-comparison__summary"><article><span>Observações alinhadas</span><strong>{rows.length.toLocaleString('pt-BR')}</strong><small>país–ano</small></article><article><span>Correlação descritiva</span><strong>{formatCorrelation(unemploymentCorrelation)}</strong><small>desemprego × refugiados/1.000</small></article><article><span>Correlação descritiva</span><strong>{formatCorrelation(vulnerableCorrelation)}</strong><small>emprego vulnerável × refugiados/1.000</small></article></div>
      <div className="work-migration-comparison__table"><table><caption>Doze países com maior taxa de refugiados acolhidos no último ano alinhado</caption><thead><tr><th>País</th><th>Ano</th><th>Desemprego</th><th>Emprego vulnerável</th><th>Refugiados/1.000</th></tr></thead><tbody>{latestByCountry.map((row) => <tr key={row.countryCode}><th scope="row">{row.countryName}</th><td>{row.year}</td><td>{row.unemployment.toFixed(1)}%</td><td>{row.vulnerableEmployment.toFixed(1)}%</td><td>{row.refugeesPerThousand.toFixed(1)}</td></tr>)}</tbody></table></div>
      <p className="meta">A correlação resume associação linear no recorte alinhado. Ela não controla conflito, renda, políticas de acolhida, composição etária ou causalidade reversa; não deve ser lida como efeito do desemprego sobre a migração.</p>
    </> : <p className="comparison-warning">Carregando as três séries de trabalho, migração e população para encontrar observações alinhadas.</p>}
  </section>
}
