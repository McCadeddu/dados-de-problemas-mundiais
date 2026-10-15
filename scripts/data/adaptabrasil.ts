import { ADAPTA_BASE, ADAPTA_INDICATOR, ADAPTA_SCHEMA, type AdaptaLegend, type AdaptaState } from '../../src/lib/adaptabrasil.js'
export type AdaptaHierarchyItem = { id: number; name: string; indicator_id_master: string; simple_description: string;
  years: number[]; years_description: Array<{ year: number; label: string; description: string }> | null;
  scenarios: Array<{ value: number; label: string; description: string }> | null;
  legend: { items: AdaptaLegend[] } | null; menu_structure: { clippingresolutions: Array<{ id: string; clippings: Array<{ id: string; resolutions: Array<{ id: string; recordcount: number }> }> }> } | null }
export type RawAdaptaRow = { geocod_ibge: string; state: string; name: string; indicator_id: number; year: number;
  scenario_id: number | null; value: number | null; valuecolor: string; rangelabel: string }
export type StateCrosswalk = { sourceUrl: string; reviewedAt: string; states: Array<{ code: string; abbreviation: string; name: string }> }
export const ADAPTA_SELECTIONS = [{ year: 2020, scenario: null }, { year: 2030, scenario: 49 }, { year: 2030, scenario: 50 },
  { year: 2050, scenario: 49 }, { year: 2050, scenario: 50 }] as const
export const adaptaRequestUrl = (year: number, scenario: number | null) => `${ADAPTA_BASE}/api/mapa-dados/BR/estado/${ADAPTA_INDICATOR}/${year}/${scenario}/${ADAPTA_SCHEMA}`
export function validateAdaptaHierarchy(hierarchy: AdaptaHierarchyItem[]) {
  const indicator = hierarchy.find(i => i.id === ADAPTA_INDICATOR)
  const sector = hierarchy.find(i => i.id === 1)
  const stateResolution = sector?.menu_structure?.clippingresolutions.find(c => c.id === 'brasil')?.clippings.find(c => c.id === 'BR')?.resolutions.find(r => r.id === 'estado')
  if (!indicator || indicator.name !== 'Risco de estresse hídrico' || indicator.indicator_id_master !== '1'
    || !sector || stateResolution?.recordcount !== 27 || [2020, 2030, 2050].some(y => !indicator.years.includes(y)
      || !sector.years_description?.find(v => v.year === y)?.description)
    || [49, 50].some(id => !sector.scenarios?.some(s => s.value === id && s.description))
    || indicator.legend?.items.filter(l => l.minvalue !== null).length !== 5) throw new Error('Metadados AdaptaBrasil exigem revisão')
  const expected = [[0, .19], [.2, .39], [.4, .59], [.6, .79], [.8, 1]]
  const legend = [...indicator.legend.items].filter(l => l.minvalue !== null).sort((a, b) => a.order - b.order)
  if (legend.some((l, i) => l.minvalue !== expected[i][0] || l.maxvalue !== expected[i][1] || !/^#[0-9a-f]{6}$/i.test(l.color))) throw new Error('Escala AdaptaBrasil alterada')
  return { indicator, sector, legend }
}
export function normalizeAdaptaRows(rows: RawAdaptaRow[], year: number, scenario: number | null, crosswalk: StateCrosswalk, legend: AdaptaLegend[]) {
  if (!Array.isArray(rows) || rows.length !== 27 || crosswalk.states.length !== 27) throw new Error('Cobertura AdaptaBrasil incompleta')
  const seen = new Set<string>()
  const states: AdaptaState[] = rows.map(row => {
    const state = crosswalk.states.find(s => s.abbreviation === row.state)
    if (!state || state.name.normalize('NFC') !== row.name.normalize('NFC') || seen.has(state.code)
      || row.indicator_id !== ADAPTA_INDICATOR || row.year !== year || row.scenario_id !== scenario) throw new Error('Território, ano ou cenário AdaptaBrasil inesperado')
    seen.add(state.code)
    if (row.value !== null && (typeof row.value !== 'number' || !Number.isFinite(row.value) || row.value < 0 || row.value > 1)) throw new Error('Índice AdaptaBrasil fora da escala')
    const band = legend.find(l => row.value !== null && l.minvalue !== null && l.maxvalue !== null && row.value >= l.minvalue && row.value <= l.maxvalue)
    if (row.value !== null && (!band || band.label !== row.rangelabel || band.color.toUpperCase() !== row.valuecolor.toUpperCase())) throw new Error('Faixa de risco AdaptaBrasil divergente')
    return { code: state.code, abbreviation: state.abbreviation, name: state.name, sourceCode: row.geocod_ibge,
      value: row.value, category: row.value === null ? 'Dado indisponível' : row.rangelabel, color: row.value === null ? '#DCDCDC' : row.valuecolor }
  }).sort((a, b) => a.name.localeCompare(b.name))
  return states
}
