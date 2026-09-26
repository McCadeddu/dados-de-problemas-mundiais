import type { DashboardData, Indicator, Series, Source } from '../../src/types.js'
import { fetchJsonWithRetry } from './http.js'

export const FOOD_STATES_URL = 'https://apisidra.ibge.gov.br/values/t/9552/n3/all/v/9784/p/all/c1/6795/c12404/109099,109101,109102'
export const STATE_CODES = '11 12 13 14 15 16 17 21 22 23 24 25 26 27 28 29 31 32 33 35 41 42 43 50 51 52 53'.split(' ')
const categories = [
  { code: '109099', id: 'ibge-state-food-insecurity', name: 'Domicílios com alguma insegurança alimentar', definition: 'Inclui insegurança leve, moderada e grave.' },
  { code: '109101', id: 'ibge-state-food-insecurity-moderate', name: 'Domicílios com insegurança alimentar moderada', definition: 'Mede o nível moderado, sem incluir o grave.' },
  { code: '109102', id: 'ibge-state-food-insecurity-severe', name: 'Domicílios com insegurança alimentar grave', definition: 'Mede exclusivamente o nível grave.' },
]
export type StateFoodCollection = { fetchedAt: string; lastAttemptAt: string; cached: boolean; requestUrl: string; series: Series[] }
type Row = { NC?: string; MN?: string; D1C?: string; D1N?: string; D2C?: string; D3C?: string; D4C?: string; D5C?: string; V?: string }

export function parseStateFoodSecurity(raw: unknown): Series[] {
  if (!Array.isArray(raw) || raw.length < 2) throw new Error('IBGE 9552: resposta vazia')
  const grouped = new Map<string, Series>()
  const cells = new Map<string, number>()
  const years = new Set<number>()
  for (const item of raw.slice(1)) {
    if (!item || typeof item !== 'object') throw new Error('IBGE 9552: registro inválido')
    const row = item as Row
    const category = categories.find((entry) => entry.code === row.D5C)
    if (row.NC !== '3' || !STATE_CODES.includes(row.D1C ?? '') || !row.D1N?.trim()
      || row.D2C !== '9784' || row.MN !== '%' || row.D4C !== '6795' || !category
      || !/^\d{4}$/.test(row.D3C ?? '') || !/^\d+(\.\d+)?$/.test(row.V ?? '')) {
      throw new Error('IBGE 9552: dimensões alteradas ou observação ausente/inválida')
    }
    const year = Number(row.D3C), value = Number(row.V)
    if (year < 2023 || value < 0 || value > 100) throw new Error('IBGE 9552: período ou percentual inválido')
    const cell = `${row.D1C}:${year}:${row.D5C}`
    if (cells.has(cell)) throw new Error('IBGE 9552: observação duplicada')
    cells.set(cell, value)
    years.add(year)
    const key = `${row.D1C}:${category.id}`
    const series = grouped.get(key) ?? { indicatorId: category.id, geographyType: 'brazil-state', geographyCode: row.D1C!, geographyName: row.D1N!, points: [] }
    series.points.push({ year, value })
    grouped.set(key, series)
  }
  if (!years.has(2023) || !years.has(2024)) throw new Error('IBGE 9552: histórico incompleto')
  for (const year of years) for (const state of STATE_CODES) {
    const values = categories.map((category) => cells.get(`${state}:${year}:${category.code}`))
    if (values.some((value) => value === undefined)) throw new Error('IBGE 9552: cobertura incompleta de UF/ano/categoria')
    if (values[1]! + values[2]! > values[0]! + 0.1) throw new Error('IBGE 9552: categorias incompatíveis com o total')
  }
  return [...grouped.values()].map((entry) => ({ ...entry, points: entry.points.sort((a, b) => a.year - b.year) }))
}

export async function collectStateFoodSecurity(previous?: StateFoodCollection, fetcher: typeof fetch = fetch): Promise<StateFoodCollection> {
  const lastAttemptAt = new Date().toISOString()
  try {
    const series = parseStateFoodSecurity(await fetchJsonWithRetry(FOOD_STATES_URL, { fetcher }))
    if (previous?.series.some((old) => old.points.some((point) => !series.some((entry) => entry.indicatorId === old.indicatorId && entry.geographyCode === old.geographyCode && entry.points.some((next) => next.year === point.year))))) {
      throw new Error('IBGE 9552: perda de período já integrado')
    }
    return { series, fetchedAt: lastAttemptAt, lastAttemptAt, cached: false, requestUrl: FOOD_STATES_URL }
  } catch (error) {
    if (!previous?.series.length) throw error
    console.warn(`IBGE 9552 indisponível; preservando coleta de ${previous.fetchedAt}: ${String(error)}`)
    return { ...previous, cached: true, lastAttemptAt }
  }
}

export function integrateStateFoodSecurity(data: DashboardData, collection: StateFoodCollection): DashboardData {
  const latestYear = Math.max(...collection.series.flatMap((entry) => entry.points.map((point) => point.year)))
  const source: Source = { id: 'ibge-food-security-9552', name: 'IBGE PNAD Contínua — Segurança alimentar (9552)', url: 'https://sidra.ibge.gov.br/tabela/9552', methodologyUrl: 'https://www.ibge.gov.br/biblioteca/visualizacao/livros/liv102084.pdf', license: 'Dados públicos do IBGE; citar a fonte', lastUpdated: `Referência: ${latestYear}. Coleta: ${collection.fetchedAt.slice(0, 10)}.${collection.cached ? ' Última tentativa falhou; exibindo coleta anterior.' : ''}` }
  const indicators: Indicator[] = categories.map((category) => ({ id: category.id, name: category.name, themeId: 'hunger-water', unit: '%', geographyType: 'brazil-state', sourceId: source.id, direction: 'higher-worse', latestYear,
    description: `Percentual dos domicílios particulares permanentes da UF, urbanos e rurais, conforme a EBIA na PNAD Contínua (IBGE/SIDRA 9552). ${category.definition} O denominador é o total de domicílios representados pela pesquisa, não a população. Estimativas amostrais: diferenças entre UFs não demonstram significância estatística. Não equivale à subalimentação mundial ou ao acesso à água.`,
  }))
  const ids = new Set(indicators.map((entry) => entry.id))
  const latest = collection.series.map((entry) => ({ indicatorId: entry.indicatorId, geographyType: entry.geographyType, geographyCode: entry.geographyCode, geographyName: entry.geographyName, ...entry.points.at(-1)! }))
  return { ...data,
    indicators: [...data.indicators.filter((entry) => !ids.has(entry.id)), ...indicators],
    sources: [...data.sources.filter((entry) => entry.id !== source.id), source],
    latest: [...data.latest.filter((entry) => !ids.has(entry.indicatorId)), ...latest],
    rankings: [...data.rankings.filter((entry) => !ids.has(entry.indicatorId)), ...indicators.map((indicator) => ({ indicatorId: indicator.id, geographyType: indicator.geographyType, year: latestYear, items: latest.filter((entry) => entry.indicatorId === indicator.id).sort((a, b) => b.value - a.value) }))],
  }
}
