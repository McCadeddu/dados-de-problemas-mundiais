import { useMemo, useState } from 'react'
import type { DashboardData } from '../types'
import { alignedRowsCsv, alignWorkMigration, migrationMeasures, pearson, spearman, type MigrationMeasure } from '../lib/workMigration'

export function WorkMigrationComparisonPanel({ data, continent = 'Todos', loadError = null }: {
  data: DashboardData; continent?: string; loadError?: string | null
}) {
  const [measure, setMeasure] = useState<MigrationMeasure>('refugees')
  const [selectedYear, setSelectedYear] = useState('latest')
  const migration = migrationMeasures[measure]
  const aligned = useMemo(() => alignWorkMigration(data, migration.id), [data, migration.id])
  const years = [...new Set(aligned.map((row) => row.year))].sort((a, b) => b - a)
  const year = selectedYear === 'latest' ? years[0] : Number(selectedYear)
  const rows = aligned.filter((row) => row.year === year && (continent === 'Todos' || row.continent === continent))
    .sort((a, b) => b.migrationPerThousand - a.migrationPerThousand || a.countryCode.localeCompare(b.countryCode))
  const countries = data.countries.filter((country) => continent === 'Todos' || country.continent === continent)
  const included = new Set(rows.map((row) => row.countryCode))
  const excluded = countries.filter((country) => !included.has(country.code))
  const ready = ['ilo-unemployment', 'ilo-vulnerable-employment', migration.id]
    .every((id) => data.series.some((series) => series.indicatorId === id)) && data.countryPopulation.length > 0
  const rUnemployment = pearson(rows, 'unemployment')
  const rVulnerable = pearson(rows, 'vulnerableEmployment')
  const rhoUnemployment = spearman(rows, 'unemployment')
  const rhoVulnerable = spearman(rows, 'vulnerableEmployment')
  const formatR = (value: number | null) => value === null ? 'Não calculável' : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const format = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const sourceIds = ['ilo-unemployment', 'ilo-vulnerable-employment', migration.id]
    .map((id) => data.indicators.find((indicator) => indicator.id === id)?.sourceId)
  // Population is distributed with the World Bank series in this dataset.
  const sources = data.sources.filter((source) => [...sourceIds, 'world-bank'].includes(source.id))

  function download() {
    const blob = new Blob([alignedRowsCsv(rows, migration.id, data.generatedAt)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `trabalho-migracao-${measure}-${year}-${continent}.csv`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <section className="panel work-migration-comparison" aria-label="Comparação descritiva entre trabalho e migração">
    <div className="panel__header">
      <div><span>Comparação anual</span><h3>Trabalho e migração no mesmo recorte</h3>
        <p>Uma observação por país ou território, no ano escolhido. A taxa migratória usa a população desse mesmo ano.</p>
        <p>Continente: <strong>{continent === 'Todos' ? 'Mundo inteiro' : continent}</strong>. Use o filtro de continente no início da página para alterar este recorte.</p>
      </div>
      <div className="work-migration-comparison__actions">
        <label>Medida migratória<select value={measure} onChange={(event) => { setMeasure(event.target.value as MigrationMeasure); setSelectedYear('latest') }}>
          {Object.entries(migrationMeasures).map(([key, item]) => <option key={key} value={key}>{item.title}</option>)}
        </select></label>
        <label>Ano comum<select value={selectedYear} disabled={!years.length} onChange={(event) => setSelectedYear(event.target.value)}>
          <option value="latest">Mais recente disponível{years.length > 0 ? ` (${years[0]})` : ''}</option>
          {years.map((value) => <option key={value} value={value}>{value}</option>)}
        </select></label>
        <strong className="badge">Sem causalidade</strong>
        <button className="export-button" onClick={download} disabled={!ready || !rows.length}>Baixar CSV alinhado</button>
      </div>
    </div>
    {!ready ? <p role={loadError ? 'alert' : 'status'}>{loadError ? 'Não foi possível carregar as séries necessárias à comparação. Recarregue a página para tentar novamente.' : 'Carregando séries de trabalho, migração e população…'}</p> : <>
      <p className="comparison-warning">{rows.length} de {countries.length} países e territórios incluídos{year !== undefined ? ` em ${year}` : ''}; {excluded.length} excluídos por falta de pelo menos uma observação válida no mesmo ano. Ausência não é zero.</p>
      {excluded.length > 0 && <details><summary>Ver países e territórios excluídos ({excluded.length})</summary><p>{excluded.map((country) => country.name).join('; ')}.</p><p>É necessário ter as duas taxas de trabalho, o estoque migratório e uma população positiva no ano selecionado.</p></details>}
      {rows.length > 0 ? <>
        <div className="work-migration-comparison__summary">
          <article><span>Amostra do recorte</span><strong>{rows.length.toLocaleString('pt-BR')}</strong><small>países e territórios · {year}</small></article>
          <article><span>Pearson r — desemprego</span><strong>{formatR(rUnemployment)}</strong><small>desemprego × {migration.title.toLowerCase()}/1.000</small></article>
          <article><span>Pearson r — emprego vulnerável</span><strong>{formatR(rVulnerable)}</strong><small>emprego vulnerável × {migration.title.toLowerCase()}/1.000</small></article>
          <article><span>Spearman ρ — desemprego</span><strong>{formatR(rhoUnemployment)}</strong><small>associação monotônica por postos</small></article>
          <article><span>Spearman ρ — emprego vulnerável</span><strong>{formatR(rhoVulnerable)}</strong><small>associação monotônica por postos</small></article>
        </div>
        {(rUnemployment === null || rVulnerable === null) && <p className="meta">A correlação exige pelo menos três países ou territórios e variação nas duas medidas.</p>}
        <details open={rows.length <= 12}><summary>Ver tabela completa ({rows.length} países e territórios)</summary>
          <div className="work-migration-comparison__table"><table>
            <caption>{migration.title} por mil habitantes · {year} · todos os registros usados nos cálculos e no CSV</caption>
            <thead><tr><th scope="col">País / território</th><th scope="col">Ano</th><th scope="col">Desemprego</th><th scope="col">Emprego vulnerável</th><th scope="col">{migration.title}/1.000</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.countryCode}><th scope="row">{row.countryName}</th><td>{row.year}</td><td>{format(row.unemployment)}%</td><td>{format(row.vulnerableEmployment)}%</td><td>{format(row.migrationPerThousand)}</td></tr>)}</tbody>
          </table></div>
        </details>
        <p className="meta">CSV: valores sem arredondamento, população usada no denominador, código do indicador migratório e data do arquivo de dados.</p>
      </> : <p>Sem observações compatíveis neste recorte. Escolha outro ano ou continente.</p>}
      <p className="meta">Pearson r descreve associação linear; Spearman ρ compara a ordem dos países e é menos sensível a valores extremos. Ambos dão peso igual por território, dependem da cobertura e não são efeitos causais nem relações entre indivíduos. Não controlam conflito, renda, composição etária ou políticas de acolhida.</p>
      <p className="meta">O alinhamento anual não torna idênticas as populações de referência: as taxas de trabalho usam força de trabalho ou ocupados; o estoque migratório usa população total. Refugiados, solicitantes de asilo e estoque migrante podem se sobrepor e não devem ser somados.</p>
      {sources.length > 0 && <p className="meta">Fontes: {sources.map((source, index) => <span key={source.id}>{index > 0 && ' · '}<a href={source.url} target="_blank" rel="noreferrer">{source.name}</a></span>)}.</p>}
    </>}
  </section>
}
