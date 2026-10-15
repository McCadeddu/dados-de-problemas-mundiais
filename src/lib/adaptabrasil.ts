export const ADAPTA_BASE = 'https://sistema.adaptabrasil.mcti.gov.br'
export const ADAPTA_SCHEMA = 'adaptabrasil'
export const ADAPTA_INDICATOR = 2
export type AdaptaLegend = { order: number; label: string; color: string; minvalue: number | null; maxvalue: number | null }
export type AdaptaState = { code: string; abbreviation: string; name: string; sourceCode: string; value: number | null; category: string; color: string }
export type AdaptaSnapshot = { key: string; year: number; yearLabel: string; period: string; scenarioId: number | null;
  scenarioLabel: string; scenarioDescription: string; requestUrl: string; portalUrl: string; states: AdaptaState[] }
export type AdaptaData = { fetchedAt: string; lastAttemptAt: string; cached: boolean; indicatorId: number; indicatorName: string;
  definition: string; sector: string; scale: [number, number]; legend: AdaptaLegend[]; snapshots: AdaptaSnapshot[];
  hierarchyUrl: string; sourceFile: string; sourceSha256: string; crosswalkSourceUrl: string; crosswalkReviewedAt: string;
  crosswalkWarnings: Array<{ abbreviation: string; sourceCode: string; ibgeCode: string }> }

export function parseAdaptaData(value: unknown): AdaptaData {
  const d = value as AdaptaData
  if (!d || d.indicatorId !== ADAPTA_INDICATOR || !Array.isArray(d.snapshots) || d.snapshots.length !== 5
    || !Array.isArray(d.legend) || d.scale?.[0] !== 0 || d.scale?.[1] !== 1
    || new Set(d.snapshots.map(s => s.key)).size !== 5) throw new Error('Recortes AdaptaBrasil inválidos')
  const expected = new Set(['2020/null', '2030/49', '2030/50', '2050/49', '2050/50'])
  for (const snapshot of d.snapshots) {
    if (!expected.delete(`${snapshot.year}/${snapshot.scenarioId}`) || snapshot.states.length !== 27
      || new Set(snapshot.states.map(s => s.code)).size !== 27 || !snapshot.period || !snapshot.scenarioLabel) throw new Error('Cobertura ou cenário AdaptaBrasil inválido')
    for (const s of snapshot.states) if (!/^\d{2}$/.test(s.code) || !/^[A-Z]{2}$/.test(s.abbreviation)
      || (s.value !== null && (typeof s.value !== 'number' || !Number.isFinite(s.value) || s.value < 0 || s.value > 1))) throw new Error('Observação AdaptaBrasil inválida')
  }
  return d
}

export function adaptaCsv(data: AdaptaData, snapshot: AdaptaSnapshot) {
  const quote = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`
  return '\ufeff' + [['codigo_ibge', 'sigla_uf', 'uf', 'codigo_original_fonte', 'indicador_id', 'indicador', 'referencia_horizonte', 'periodo', 'cenario_id', 'cenario', 'valor_indice_0_a_1', 'faixa_fonte', 'coleta', 'consulta'],
    ...snapshot.states.map(s => [s.code, s.abbreviation, s.name, s.sourceCode, data.indicatorId, data.indicatorName,
      snapshot.year, snapshot.period, snapshot.scenarioId, snapshot.scenarioLabel, s.value, s.category, data.fetchedAt, snapshot.requestUrl])].map(row => row.map(quote).join(',')).join('\r\n')
}
