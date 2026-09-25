import { readSheet, type SheetData } from 'read-excel-file/node'
import type { NationalData } from '../../src/types.js'
import { fetchBufferWithRetry } from './http.js'

// Advance the reviewed publication only after checking its definitions and schema.
export const STATSSA_EDITION = '2026-Q2'
export const STATSSA_URL = 'https://www.statssa.gov.za/publications/P0211/QLFS%20Trends%202008-2026Q2.xlsx'
type Collection = NonNullable<NationalData['southAfricaUnemployment']>
const quarters = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec']

export function parseStatsSaUnemployment(rows: SheetData): Pick<Collection, 'points' | 'sourceNotes'> {
  if (rows[0]?.[0] !== 'Table 2: Labour force characteristics by sex - All population groups') throw new Error('Stats SA: tabela inesperada')
  const start = rows.findIndex((row) => row[0] === 'Both sexes')
  const end = rows.findIndex((row) => row[0] === 'Women')
  if (start < 0 || end <= start || rows.filter((row) => row[0] === 'Both sexes').length !== 1) throw new Error('Stats SA: recorte por sexo não identificado')
  const total = rows.slice(start + 1, end)
  const rates = total.filter((row) => row[0] === 'LU1- Unemployment rate')
  if (!total.some((row) => row[0] === 'Population 15-64 years')
    || !total.some((row) => row[0] === 'Labour underutilization indicators (%)') || rates.length !== 1) throw new Error('Stats SA: idade, unidade ou indicador inesperados')
  const headers = rows[1]?.slice(1)
  if (!headers?.length || rates[0].length !== headers.length + 1) throw new Error('Stats SA: cabeçalhos ou valores ausentes')
  const points = headers.map((header, index) => {
    const match = /^(Jan-Mar|Apr-Jun|Jul-Sep|Oct-Dec) (\d{4})$/.exec(String(header))
    if (!match) throw new Error('Stats SA: trimestre inválido')
    const year = Number(match[2])
    const quarter = quarters.indexOf(match[1])
    if (year * 4 + quarter !== 2008 * 4 + index) throw new Error('Stats SA: trimestre omitido, duplicado ou fora de ordem')
    const value = rates[0][index + 1]
    // No absence marker is documented for this series. Reject rather than infer zero.
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) throw new Error('Stats SA: percentual inválido ou ausente')
    return { period: `${year}-Q${quarter + 1}`, value }
  })
  if (points.length < 74 || points.at(-1)?.period !== STATSSA_EDITION) throw new Error('Stats SA: cobertura diferente da edição revisada')
  const footer = rows.findIndex((row) => typeof row[0] === 'string' && row[0].startsWith('For all values of 10 000'))
  if (footer < end) throw new Error('Stats SA: notas da fonte ausentes')
  const sourceNotes = rows.slice(footer).map((row) => row.filter((cell) => cell !== null).join(' ')).filter(Boolean)
  return { points, sourceNotes }
}

export async function collectStatsSaUnemployment(previous?: Collection, fetcher: typeof fetch = fetch): Promise<Collection> {
  const lastAttemptAt = new Date().toISOString()
  try {
    const buffer = Buffer.from(await fetchBufferWithRetry(STATSSA_URL, { fetcher }))
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) throw new Error('Stats SA: resposta não é XLSX; possível página de bloqueio')
    const result = parseStatsSaUnemployment(await readSheet(buffer, 'Table 2'))
    if (previous && (previous.edition > STATSSA_EDITION || previous.points.length > result.points.length)) throw new Error('Stats SA: redução de cobertura ou edição anterior')
    return { ...result, edition: STATSSA_EDITION, sourceUpdatedAt: '2026-08-11', fetchedAt: lastAttemptAt, lastAttemptAt, cached: false,
      sourceUrl: 'https://www.statssa.gov.za/?PPN=P0211&page_id=1854',
      methodologyUrl: 'https://www.statssa.gov.za/publications/P0211/P02112ndQuarter2026.pdf',
      licenseUrl: 'https://www.statssa.gov.za/?page_id=425', requestUrl: STATSSA_URL }
  } catch (error) {
    if (!previous?.points.length) throw error
    console.warn(`Stats SA indisponível; mantendo coleta de ${previous.fetchedAt}: ${String(error)}`)
    return { ...previous, cached: true, lastAttemptAt }
  }
}
