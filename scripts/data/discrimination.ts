import type { DashboardData, Indicator, Series, Source } from '../../src/types.js'
import { DISCRIMINATION_ID, DISCRIMINATION_METADATA, DISCRIMINATION_NOTE } from '../../src/lib/discrimination.js'

export const SDG_API = 'https://unstats.un.org/sdgapi/v1/sdg'
export const SDG_TOTAL_DIMENSIONS: Record<string, string> = { Sex: 'BOTHSEX', Age: 'ALLAGE', Location: 'ALLAREA',
  'Disability status': '_T', 'Education level': '_T', Quantile: '_T', 'Grounds of discrimination': 'ALL', 'Reporting Type': 'G' }
export type SdgObservation = { indicator: string[]; series: string; geoAreaCode: string; geoAreaName: string;
  timePeriodStart: number; value: string; valueType: string; source: string; footnotes: string[];
  time_detail?: string | null; timeCoverage?: string | null;
  attributes: Record<string, string>; dimensions: Record<string, string> }
export type SdgPage = { size: number; totalElements: number; totalPages: number; pageNumber: number; data: SdgObservation[] }
export function validateSdgPage(page: SdgPage, expectedPage: number, count?: number): void {
  if (!page || page.pageNumber !== expectedPage || !Number.isInteger(page.totalElements) || page.totalElements < 1
    || !Number.isInteger(page.totalPages) || page.totalPages < 1 || page.totalPages > 500
    || page.size !== 100 || page.totalPages !== Math.ceil(page.totalElements / 100)
    || (count !== undefined && page.totalElements !== count) || !Array.isArray(page.data)
    || page.data.length !== Math.min(100, page.totalElements - (expectedPage - 1) * 100)) throw new Error('Paginação ONU incompleta ou alterada')
}
export function normalizeDiscrimination(rows: SdgObservation[], mapping: Map<number, string>, countries: DashboardData['countries']) {
  const known = new Map(countries.map(c => [c.code, c.name]))
  const reasons: Record<string, number> = {}
  const reject = (reason: string) => { reasons[reason] = (reasons[reason] ?? 0) + 1 }
  const byCountry = new Map<string, Series>()
  const selected: SdgObservation[] = []
  const keys = new Set<string>()
  for (const row of rows) {
    if (row.series !== 'VC_VOV_GDSD' || !Array.isArray(row.indicator) || !row.dimensions || !row.attributes || !Array.isArray(row.footnotes)) throw new Error('Estrutura ONU inesperada')
    // The same series is attached to 10.3.1 and 16.b.1: select one attachment, never add both.
    if (!row.indicator.includes('16.b.1')) { reject('outro indicador ODS'); continue }
    if (Object.keys(row.dimensions).some(k => !(k in SDG_TOTAL_DIMENSIONS))) throw new Error('Nova dimensão ONU exige revisão')
    if (!Object.entries(SDG_TOTAL_DIMENSIONS).every(([key, value]) => row.dimensions[key] === value)) { reject('recorte desagregado ou tipo de reporte diferente'); continue }
    const code = mapping.get(Number(row.geoAreaCode))
    if (!code || !known.has(code)) { reject('área fora do catálogo ou sem correspondência M49'); continue }
    if (row.attributes.Nature !== 'C') { reject('natureza diferente de dado nacional C'); continue }
    if (row.attributes.Units !== 'PERCENT' || !['A', 'B'].includes(row.attributes['Observation Status'])) { reject('unidade ou status não elegível'); continue }
    const notes = row.footnotes.join(' ')
    // Metadata defines the intended indicator; individual observations can declare a different window.
    const windows = [...notes.matchAll(/(?:last|previous|past)\s+(\d+)\s+(months?|years?)/gi)]
    if (!windows.length || windows.some(m => Number(m[1]) !== 12 || !m[2].toLowerCase().startsWith('month'))) { reject('janela de 12 meses não comprovada ou divergente'); continue }
    if (!Number.isInteger(row.timePeriodStart) || row.valueType !== 'Float' || !/^\d+(\.\d+)?$/.test(row.value)) { reject('ano ou valor não numérico'); continue }
    const value = Number(row.value)
    if (!Number.isFinite(value) || value < 0 || value > 100) { reject('percentual inválido'); continue }
    const key = `${code}/${row.timePeriodStart}`
    if (keys.has(key)) throw new Error(`Observações ONU ambíguas: ${key}`)
    keys.add(key)
    const sourceFootnote = [`Pesquisa: ${row.source || 'não informada'}.`, 'Natureza: C (dado nacional).',
      `Status ONU: ${row.attributes['Observation Status']}${row.attributes['Observation Status'] === 'B' ? ' (quebra de série)' : ' (valor normal)'}.`,
      row.time_detail ? `Período declarado: ${row.time_detail}.` : '', row.timeCoverage ? `Cobertura temporal: ${row.timeCoverage}.` : '', ...row.footnotes].filter(Boolean).join(' ')
    const series = byCountry.get(code) ?? { indicatorId: DISCRIMINATION_ID, geographyType: 'country', geographyCode: code, geographyName: known.get(code)!, points: [] }
    series.points.push({ year: row.timePeriodStart, value, sourceFootnote,
      sourceObservationStatus: `Nature=C; Observation Status=${row.attributes['Observation Status']}` })
    byCountry.set(code, series); selected.push(row)
  }
  return { series: [...byCountry.values()].map(s => ({ ...s, points: s.points.sort((a, b) => a.year - b.year) })).sort((a, b) => a.geographyCode.localeCompare(b.geographyCode)), selected, reasons }
}
export function integrateDiscrimination(data: DashboardData, series: Series[], release: string): DashboardData {
  if (!series.length) throw new Error('Nenhuma observação de discriminação elegível')
  const source: Source = { id: 'un-ohchr-discrimination', name: 'OHCHR / Base Global ODS da ONU',
    url: `${SDG_API}/Indicator/16.b.1/Series/List`, methodologyUrl: DISCRIMINATION_METADATA,
    lastUpdated: `Edição ONU: ${release}; referência e coleta distinguidas no diagnóstico`, license: 'UNSD / OHCHR; citar a fonte e as pesquisas nacionais; condições de uso da ONU' }
  const indicator: Indicator = { id: DISCRIMINATION_ID, name: 'Discriminação relatada — 12 meses confirmados na nota',
    themeId: 'gender-equality', geographyType: 'country', sourceId: source.id, unit: '%', direction: 'neutral',
    latestYear: Math.max(...series.flatMap(s => s.points.map(p => p.year))),
    description: `ODS 16.b.1 / 10.3.1, série VC_VOV_GDSD. Percentual da população da pesquisa que relata experiência pessoal de discriminação ou assédio. Seleção: ambos os sexos, total da pesquisa sem desagregações, natureza C (dado nacional) e nota explícita de 12 meses. ALLAGE significa sem desagregação por idade, não cobertura de todas as idades. ${DISCRIMINATION_NOTE}` }
  const latest = series.map(s => ({ indicatorId: s.indicatorId, geographyType: s.geographyType, geographyCode: s.geographyCode, geographyName: s.geographyName, ...s.points.at(-1)! }))
  return { ...data, indicators: [...data.indicators.filter(i => i.id !== indicator.id), indicator],
    sources: [...data.sources.filter(s => s.id !== source.id), source], latest: [...data.latest.filter(v => v.indicatorId !== indicator.id), ...latest],
    // No country ranking is produced from different survey populations and instruments.
    rankings: data.rankings.filter(r => r.indicatorId !== indicator.id) }
}
