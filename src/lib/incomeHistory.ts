import type { IncomeDistribution } from './incomeDistribution.js'

export type IncomeHistoryRow = {
  indicatorId: string; countryCode: string; year: number; value: number | null
  previousYear: number | null; gapYears: number | null
  status: 'absent' | 'initial' | 'unknown' | 'changed' | 'unchanged'
  changes: string[]; sourceFootnote: string; previousFootnote: string
}
export const incomeHistoryLabels: Record<IncomeHistoryRow['status'], string> = {
  absent: 'Sem valor neste ano', initial: 'Primeira observação disponível', unknown: 'Metadados insuficientes para conferir a transição',
  changed: 'Mudança declarada nas notas WDI', unchanged: 'Sem mudança nos campos conferidos; comparabilidade não comprovada',
}

/** Compare consecutive available observations, retaining missing years and avoiding inferred annual changes. */
export function incomeHistoryRows(data: IncomeDistribution): IncomeHistoryRow[] {
  return data.series.flatMap(series => {
    let previous: typeof series.points[number] | undefined
    return [...series.points].sort((a, b) => a.year - b.year).map(point => {
      const row: IncomeHistoryRow = { indicatorId: series.indicatorId, countryCode: series.countryCode, year: point.year,
        value: point.value, previousYear: previous?.year ?? null, gapYears: previous ? point.year - previous.year : null,
        status: 'absent', changes: [], sourceFootnote: point.sourceFootnote ?? '', previousFootnote: previous?.sourceFootnote ?? '' }
      if (point.value === null || !Number.isFinite(point.value)) return row
      if (!previous) row.status = 'initial'
      else if (!point.sourceIncomeMetadata || !previous.sourceIncomeMetadata) row.status = 'unknown'
      else {
        const current = point.sourceIncomeMetadata
        const old = previous.sourceIncomeMetadata
        if (current.surveyAcronym !== old.surveyAcronym) row.changes.push('sigla da pesquisa')
        if (current.welfareType !== old.welfareType) row.changes.push('conceito de renda/consumo')
        if (current.distributionType !== old.distributionType) row.changes.push('microdados/dados agrupados')
        if (current.coverageRestriction !== old.coverageRestriction) row.changes.push('restrição declarada de cobertura')
        row.status = row.changes.length ? 'changed' : 'unchanged'
      }
      previous = point
      return row
    })
  })
}

export function incomeHistoryCsv(data: IncomeDistribution, rows = incomeHistoryRows(data)) {
  const q = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`
  return '\ufeff' + [['indicador', 'pais', 'ano', 'valor_percentual', 'ano_anterior_disponivel', 'intervalo_anos', 'controle', 'campos_alterados', 'nota_wdi_atual', 'nota_wdi_anterior', 'coleta_wdi', 'atualizacao_wdi', 'cache_wdi', 'consulta', 'licenca'],
    ...rows.map(row => [row.indicatorId, row.countryCode, row.year, row.value, row.previousYear, row.gapYears,
      row.status, row.changes.join('; '), row.sourceFootnote, row.previousFootnote, data.fetchedAt, data.sourceUpdatedAt,
      data.cached, data.indicators.find(d => d.id === row.indicatorId)?.requestUrl, data.licenseUrl])]
    .map(row => row.map(q).join(',')).join('\r\n') + '\r\n'
}
