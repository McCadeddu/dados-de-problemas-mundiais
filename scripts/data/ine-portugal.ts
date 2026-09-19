import type { NationalData } from '../../src/types.js'
import { fetchJsonWithRetry } from './http.js'

export const INE_META_URL = 'https://www.ine.pt/ine/json_indicador/pindicaMeta.jsp?varcd=0012136&lang=PT'
type Collection = NonNullable<NationalData['portugalUnemployment']>
type Category = { dim_num: string; categ_cod: string; categ_dsg: string }
export type IneMetadata = {
  IndicadorCod: string; Periodic: string; UnidadeMedida: string; Potencia10: string; PrecisaoDecimal: string
  DataUltimaAtualizacao: string; Nota: string; PrimeiroPeriodo: string; UltimoPeriodo: string
  Dimensoes: {
    Descricao_Dim: Array<{ dim_num: string; versao: string }>
    Categoria_Dim: Array<Record<string, Category[]>>
  }
}
export type IneData = {
  IndicadorCod: string; DataUltimoAtualizacao: string
  Dados: Record<string, Array<{ geocod: string; dim_3: string; valor?: string; sinal_conv?: string; sinal_conv_desc?: string }>>
}

function quarter(label: string) {
  const match = /^([1-4])\.º Trimestre de (\d{4})$/.exec(label)
  if (!match) throw new Error(`INE: trimestre inválido: ${label}`)
  return `${match[2]}-Q${match[1]}`
}

export function inePeriods(meta: IneMetadata): Category[] {
  if (meta.IndicadorCod !== '0012136' || meta.Periodic !== 'Trimestral' || meta.UnidadeMedida !== 'Percentagem (%)'
    || meta.Potencia10 !== '0' || meta.PrecisaoDecimal !== '1'
    || typeof meta.Nota !== 'string' || !meta.Nota.trim()
    || !/^\d{4}-\d{2}-\d{2}$/.test(meta.DataUltimaAtualizacao)) throw new Error('INE: indicador, unidade ou frequência inesperados')
  const dimensions = meta.Dimensoes.Descricao_Dim
  if (dimensions.length !== 3 || !dimensions.some((d) => d.dim_num === '1')
    || !dimensions.some((d) => d.dim_num === '2' && d.versao === '05257')
    || !dimensions.some((d) => d.dim_num === '3' && d.versao === '00305')) throw new Error('INE: dimensões inesperadas')
  const categories = meta.Dimensoes.Categoria_Dim.flatMap((entry) => Object.values(entry).flat())
  if (!categories.some((c) => c.dim_num === '2' && c.categ_cod === 'PT' && c.categ_dsg === 'Portugal')
    || !categories.some((c) => c.dim_num === '3' && c.categ_cod === 'T' && c.categ_dsg === 'HM')) throw new Error('INE: total nacional não identificado')
  const periods = categories.filter((c) => c.dim_num === '1')
    .sort((a, b) => quarter(a.categ_dsg).localeCompare(quarter(b.categ_dsg)))
  if (!periods.length || new Set(periods.map((p) => p.categ_dsg)).size !== periods.length
    || periods.some((p) => p.categ_cod !== `S5A${quarter(p.categ_dsg).replace('-Q', '')}`)
    || periods[0].categ_dsg !== meta.PrimeiroPeriodo || periods.at(-1)!.categ_dsg !== meta.UltimoPeriodo) throw new Error('INE: períodos incompletos ou duplicados')
  return periods
}

export function parseIneUnemployment(meta: IneMetadata, raw: IneData): Collection['points'] {
  const periods = inePeriods(meta)
  if (raw.IndicadorCod !== meta.IndicadorCod || raw.DataUltimoAtualizacao !== meta.DataUltimaAtualizacao
    || Object.keys(raw.Dados).length !== periods.length) throw new Error('INE: resposta incompleta ou versão diferente dos metadados')
  const points = periods.map((p) => {
    const rows = raw.Dados[p.categ_dsg]
    if (rows?.length !== 1 || rows[0].geocod !== 'PT' || rows[0].dim_3 !== 'T') throw new Error('INE: recorte nacional inesperado ou duplicado')
    const row = rows[0]
    const value = row.valor === undefined || row.valor.trim() === '' ? null : Number(row.valor)
    if ((value === null && !row.sinal_conv) || (value !== null && (!/^\d+(\.\d+)?$/.test(row.valor!) || !Number.isFinite(value) || value > 100))) throw new Error('INE: valor inválido ou ausência sem sinalização')
    return { period: quarter(p.categ_dsg), value, ...(row.sinal_conv ? { status: row.sinal_conv } : {}), ...(row.sinal_conv_desc ? { comment: row.sinal_conv_desc } : {}) }
  })
  if (!points.some((p) => p.value !== null)) throw new Error('INE: série sem observações')
  return points
}

export async function collectIneUnemployment(previous?: Collection, fetcher: typeof fetch = fetch): Promise<Collection> {
  const lastAttemptAt = new Date().toISOString()
  try {
    const metadata = await fetchJsonWithRetry<IneMetadata[]>(INE_META_URL, { fetcher })
    if (metadata.length !== 1) throw new Error('INE: metadados ausentes ou duplicados')
    const meta = metadata[0]
    const periods = inePeriods(meta)
    const requestUrl = `https://www.ine.pt/ine/json_indicador/pindica.jsp?op=2&varcd=0012136&lang=PT&Dim2=PT&Dim3=T&Dim1=${periods.map((p) => p.categ_cod).join(',')}`
    const data = await fetchJsonWithRetry<IneData[]>(requestUrl, { fetcher })
    if (data.length !== 1) throw new Error('INE: resposta ausente ou duplicada')
    const points = parseIneUnemployment(meta, data[0])
    if (points.filter((p) => p.value !== null).length < 40
      || (previous && (points.length < previous.points.length || points.at(-1)!.period < previous.points.at(-1)!.period))) throw new Error('INE: redução de cobertura; revisar coleta')
    return {
      fetchedAt: lastAttemptAt, lastAttemptAt, sourceUpdatedAt: meta.DataUltimaAtualizacao, cached: false,
      sourceUrl: 'https://www.ine.pt/xurl/indx/0012136/PT', methodologyUrl: INE_META_URL,
      licenseUrl: 'https://dados.gov.pt/pt/datasets/taxa-de-desemprego-serie-2021-3/',
      requestUrl, sourceNote: meta.Nota, points,
    }
  } catch (error) {
    if (!previous?.points.some((p) => p.value !== null)) throw error
    console.warn(`INE Portugal indisponível; mantendo coleta de ${previous.fetchedAt}: ${String(error)}`)
    return { ...previous, cached: true, lastAttemptAt }
  }
}
