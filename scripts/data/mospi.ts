import type { NationalData } from '../../src/types.js'
import { fetchJsonWithRetry } from './http.js'
import { fetchMospi } from './mospi-http.js'

// year_type_code=2 silently excluded 13 monthly records on 2026-09-25.
// Monthly rows carry calendar year/month explicitly; validate those instead.
export const MOSPI_URL = 'https://api.mospi.gov.in/api/plfs/getData?indicator_code=3&frequency_code=3&state_code=99&gender_code=3&age_code=1&sector_code=3&limit=100&page=1&Format=JSON'
type Collection = NonNullable<NationalData['indiaUnemployment']>
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const dimensions = {
  frequency: 'Monthly', indicator: 'UR (Unemployment Rate, in per cent)', state: 'All India',
  AgeGroup: '15 years and above', gender: 'person', sector: 'rural + urban', unit: '%',
}
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

export function parseMospiUnemployment(rows: unknown[]): Collection['points'] {
  const points = rows.map((row) => {
    if (!record(row) || Object.entries(dimensions).some(([key, value]) => row[key] !== value)) throw new Error('MoSPI: recorte ou unidade inesperados')
    const month = months.indexOf(String(row.month))
    if (typeof row.year !== 'string' || !/^\d{4}$/.test(row.year) || month < 0) throw new Error('MoSPI: período inválido')
    // Unknown absence markers must not become zero through Number(null/empty).
    if (typeof row.value !== 'string' || !/^\d+(\.\d+)?$/.test(row.value)) throw new Error('MoSPI: percentual ausente ou inválido')
    const value = Number(row.value)
    if (!Number.isFinite(value) || value > 100) throw new Error('MoSPI: percentual fora da faixa')
    return { period: `${row.year}-${String(month + 1).padStart(2, '0')}`, value }
  }).sort((a, b) => a.period.localeCompare(b.period))
  if (points.length < 17) throw new Error('MoSPI: cobertura abaixo do histórico revisado')
  for (const [index, point] of points.entries()) {
    const serial = Number(point.period.slice(0, 4)) * 12 + Number(point.period.slice(5)) - 1
    if (serial !== 2025 * 12 + 3 + index) throw new Error('MoSPI: mês omitido, duplicado ou início inesperado')
  }
  const now = new Date()
  if (points.at(-1)!.period > now.toISOString().slice(0, 7)) throw new Error('MoSPI: período futuro')
  return points
}

export async function collectMospiUnemployment(previous?: Collection, fetcher: typeof fetch = fetchMospi): Promise<Collection> {
  const lastAttemptAt = new Date().toISOString()
  try {
    const rows: unknown[] = []
    let totalPages = 1
    let totalRecords = 0
    for (let page = 1; page <= totalPages; page++) {
      const url = new URL(MOSPI_URL)
      url.searchParams.set('page', String(page))
      const raw = await fetchJsonWithRetry<unknown>(url.toString(), { fetcher })
      if (!record(raw) || raw.statusCode !== true || !Array.isArray(raw.data) || !record(raw.meta_data)) throw new Error('MoSPI: resposta inválida')
      const meta = raw.meta_data
      if (meta.page !== page || meta.recordPerPage !== 100 || !Number.isInteger(meta.totalRecords)
        || !Number.isInteger(meta.totalPages) || Number(meta.totalRecords) < 1 || Number(meta.totalPages) > 12
        || meta.totalPages !== Math.ceil(Number(meta.totalRecords) / 100)) throw new Error('MoSPI: paginação inválida')
      if (page === 1) { totalPages = Number(meta.totalPages); totalRecords = Number(meta.totalRecords) }
      if (meta.totalPages !== totalPages || meta.totalRecords !== totalRecords
        || raw.data.length !== Math.min(100, totalRecords - (page - 1) * 100)) throw new Error('MoSPI: página incompleta ou cobertura alterada durante a coleta')
      rows.push(...raw.data)
    }
    const points = parseMospiUnemployment(rows)
    if (previous && (points.length < previous.points.length || points.at(-1)!.period < (previous.points.at(-1)?.period ?? ''))) throw new Error('MoSPI: redução de cobertura')
    return { points, fetchedAt: lastAttemptAt, lastAttemptAt, cached: false,
      sourceUrl: 'https://www.mospi.gov.in/themes/product/69-periodic-labour-force-survey-plfs',
      methodologyUrl: 'https://www.mospi.gov.in/sites/default/files/NMDS_2.0_PLFS_final_update.pdf',
      accessPolicyUrl: 'https://mospi.gov.in/faq', requestUrl: MOSPI_URL }
  } catch (error) {
    if (!previous?.points.length) throw error
    console.warn(`MoSPI indisponível; mantendo coleta de ${previous.fetchedAt}: ${String(error)}`)
    return { ...previous, cached: true, lastAttemptAt }
  }
}
