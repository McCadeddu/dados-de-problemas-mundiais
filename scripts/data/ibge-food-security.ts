import type { NationalData } from '../../src/types.js'
import { fetchJsonWithRetry } from './http.js'

export const IBGE_FOOD_SECURITY_URL = 'https://apisidra.ibge.gov.br/values/t/6665/n1/1/v/800/p/all/c12404/109099,109101,109102'
type Collection = NonNullable<NationalData['brazilFoodSecurity']>
type Row = { D1C?: string; D2C?: string; D3C?: string; D4C?: string; V?: string; MN?: string }

const parse = (raw: unknown): Collection['points'] => {
  if (!Array.isArray(raw) || raw.length < 2) throw new Error('IBGE segurança alimentar: resposta vazia')
  const rows = raw.slice(1) as Row[]
  if (rows.some((row) => row.D1C !== '1' || row.D2C !== '800' || row.MN !== '%' || !/^\d{4}$/.test(row.D3C ?? '')
    || !['109099', '109101', '109102'].includes(row.D4C ?? '') || !/^\d+(\.\d+)?$/.test(row.V ?? ''))) {
    throw new Error('IBGE segurança alimentar: dimensões ou valores inesperados')
  }
  const byYear = new Map<number, Partial<Collection['points'][number]>>()
  for (const row of rows) {
    const year = Number(row.D3C)
    const value = Number(row.V)
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error('IBGE segurança alimentar: percentual inválido')
    const point = byYear.get(year) ?? { year }
    if (row.D4C === '109099') point.foodInsecurity = value
    if (row.D4C === '109101') point.moderate = value
    if (row.D4C === '109102') point.severe = value
    byYear.set(year, point)
  }
  const points = [...byYear.values()].sort((a, b) => Number(a.year) - Number(b.year))
  if (points.length < 2 || points.some((point) => point.foodInsecurity === undefined || point.moderate === undefined || point.severe === undefined)) {
    throw new Error('IBGE segurança alimentar: categorias ou histórico incompletos')
  }
  for (let i = 1; i < points.length; i++) if (Number(points[i].year) <= Number(points[i - 1].year)) throw new Error('IBGE segurança alimentar: ano duplicado ou fora de ordem')
  return points as Collection['points']
}

export function parseIbgeFoodSecurity(raw: unknown) { return parse(raw) }

export async function collectIbgeFoodSecurity(previous?: Collection, fetcher: typeof fetch = fetch): Promise<Collection> {
  const lastAttemptAt = new Date().toISOString()
  try {
    const points = parse(await fetchJsonWithRetry<unknown>(IBGE_FOOD_SECURITY_URL, { fetcher }))
    if (previous && (points.length < previous.points.length || points.at(-1)!.year < previous.points.at(-1)!.year)) throw new Error('IBGE segurança alimentar: redução de cobertura')
    return { points, fetchedAt: lastAttemptAt, lastAttemptAt, cached: false,
      sourceUrl: 'https://sidra.ibge.gov.br/tabela/6665',
      methodologyUrl: 'https://www.ibge.gov.br/biblioteca/visualizacao/livros/liv102084.pdf', requestUrl: IBGE_FOOD_SECURITY_URL }
  } catch (error) {
    if (!previous?.points.length) throw error
    console.warn(`IBGE segurança alimentar indisponível; mantendo coleta de ${previous.fetchedAt}: ${String(error)}`)
    return { ...previous, cached: true, lastAttemptAt }
  }
}
