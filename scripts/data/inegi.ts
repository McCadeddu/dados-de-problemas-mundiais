import { readSheet, type SheetData } from 'read-excel-file/node'
import type { NationalData } from '../../src/types.js'
import { fetchBufferWithRetry } from './http.js'

export const INEGI_URL = 'https://www.inegi.org.mx/contenidos/programas/enoe/15ymas/tabulados/enoe_indicadores_estrategicos_2005_2026_mensual.xlsx'
type Collection = NonNullable<NationalData['mexicoUnemployment']>
const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/** Sheet 1.2: national total, relative values. Keep only the ENOE regime resumed in 2023. */
export function parseInegiUnemployment(rows: SheetData): Pick<Collection, 'points' | 'sourceNotes'> {
  const rateRows = rows.filter((row) => row[2] === 'Tasa de desocupación')
  if (rows[0]?.[0] !== 'INEGI. Encuesta Nacional de Ocupación y Empleo (ENOE).'
    || rows[3]?.[0] !== 'Nacional (Relativos)' || rows[9]?.[0] !== '2. Población de 15 años y más'
    || rateRows.length !== 1 || !rows.some((row) => row[1] === 'Tasas calculadas contra la población económicamente activa')) {
    throw new Error('INEGI: estrutura, população ou indicador inesperados')
  }
  const points: Collection['points'] = []
  let year = 0
  for (let col = 5; col < rows[6].length; col++) {
    const yearCell = rows[4][col]
    if (yearCell !== null && yearCell !== undefined) {
      if (!/^\d{4}$/.test(String(yearCell))) throw new Error('INEGI: ano desconhecido')
      year = Number(yearCell)
    }
    const month = months.indexOf(String(rows[6][col]))
    if (month < 0 || !year) throw new Error('INEGI: mês desconhecido')
    if (year < 2023) continue
    const period = `${year}-${String(month + 1).padStart(2, '0')}`
    const expected = 2023 * 12 + points.length
    if (year * 12 + month !== expected) throw new Error('INEGI: cobertura descontínua ou mês duplicado')
    const raw = rateRows[0][col]
    // Empty cells are not documented absences: reject changes in the workbook layout.
    if (raw !== 'ND' && (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0 || raw > 100)) throw new Error('INEGI: percentual inválido')
    points.push({ period, value: raw === 'ND' ? null : raw as number, ...(raw === 'ND' ? { status: 'ND' } : {}) })
  }
  const footer = rows.findIndex((row) => row[0] === 1 && typeof row[1] === 'string' && row[1].startsWith('La cifra absoluta'))
  if (footer < 0) throw new Error('INEGI: notas metodológicas ausentes')
  const sourceNotes = rows.slice(footer).map((row) => row.filter((cell) => cell !== null).join(' ')).filter(Boolean)
  if (!sourceNotes.some((note) => note.includes('a partir de enero de 2023'))) throw new Error('INEGI: regime da pesquisa não identificado')
  if (points.length < 36 || !points.some((point) => point.value !== null)) throw new Error('INEGI: cobertura insuficiente')
  return { points, sourceNotes }
}

export async function collectInegiUnemployment(previous?: Collection, fetcher: typeof fetch = fetch): Promise<Collection> {
  const lastAttemptAt = new Date().toISOString()
  try {
    const buffer = Buffer.from(await fetchBufferWithRetry(INEGI_URL, { fetcher }))
    const result = parseInegiUnemployment(await readSheet(buffer, '1.2'))
    if (previous && (result.points.length < previous.points.length || previous.points.some((point, i) => point.value !== null && result.points[i]?.value === null))) {
      throw new Error('INEGI: redução de cobertura; revisar coleta')
    }
    return { ...result, fetchedAt: lastAttemptAt, lastAttemptAt, cached: false,
      sourceUrl: 'https://www.inegi.org.mx/programas/enoe/15ymas/',
      methodologyUrl: 'https://www.inegi.org.mx/contenidos/programas/enoe/15ymas/doc/enoe_notas_infolaboral.pdf',
      licenseUrl: 'https://www.inegi.org.mx/inegi/terminos.html', requestUrl: INEGI_URL,
      precisionUrl: INEGI_URL.replace('_mensual.xlsx', '_mensual_prec.xlsx') }
  } catch (error) {
    if (!previous?.points.some((point) => point.value !== null)) throw error
    console.warn(`INEGI indisponível; mantendo coleta de ${previous.fetchedAt}: ${String(error)}`)
    return { ...previous, cached: true, lastAttemptAt }
  }
}
