import type { NationalData } from '../../src/types.js'
import type { IneMetadata, IneData } from './ine-portugal.js'
import { fetchJsonWithRetry } from './http.js'

type Collection = NonNullable<NationalData['portugalBenefits']>
export const BENEFITS_ID = 'ine-annual-unemployment-benefits'
export const BENEFITS_META = 'https://www.ine.pt/ine/json_indicador/pindicaMeta.jsp?varcd=0004348&lang=PT'

export function benefitPeriods(meta: IneMetadata) {
  if (meta.IndicadorCod !== '0004348' || meta.Periodic !== 'Anual' || meta.UnidadeMedida !== 'Número (N.º)'
    || meta.Potencia10 !== '0' || meta.PrecisaoDecimal !== '0' || !meta.Nota?.trim()
    || !/^\d{4}-\d{2}-\d{2}$/.test(meta.DataUltimaAtualizacao)) throw new Error('INE subsídios: metadados inesperados')
  const dims = meta.Dimensoes.Descricao_Dim
  if (dims.length !== 3 || !dims.some(d => d.dim_num === '1')
    || !dims.some(d => d.dim_num === '2' && d.versao === '05361')
    || !dims.some(d => d.dim_num === '3' && d.versao === '00305')) throw new Error('INE subsídios: dimensões inesperadas')
  const categories = meta.Dimensoes.Categoria_Dim.flatMap(entry => Object.values(entry).flat())
  if (!categories.some(c => c.dim_num === '2' && c.categ_cod === 'PT' && c.categ_dsg === 'Portugal')
    || !categories.some(c => c.dim_num === '3' && c.categ_cod === 'T' && c.categ_dsg === 'HM')) throw new Error('INE subsídios: total nacional ausente')
  const periods = categories.filter(c => c.dim_num === '1').sort((a, b) => a.categ_dsg.localeCompare(b.categ_dsg))
  if (!periods.length || new Set(periods.map(p => p.categ_dsg)).size !== periods.length
    || periods.some((p, i) => !/^\d{4}$/.test(p.categ_dsg) || p.categ_cod !== `S7A${p.categ_dsg}` || (i > 0 && Number(p.categ_dsg) !== Number(periods[i - 1].categ_dsg) + 1))
    || periods[0].categ_dsg !== meta.PrimeiroPeriodo || periods.at(-1)!.categ_dsg !== meta.UltimoPeriodo) throw new Error('INE subsídios: anos incompletos ou duplicados')
  return periods
}

export function parseBenefits(meta: IneMetadata, raw: IneData): Collection['points'] {
  const periods = benefitPeriods(meta)
  if (raw.IndicadorCod !== meta.IndicadorCod || raw.DataUltimoAtualizacao !== meta.DataUltimaAtualizacao
    || Object.keys(raw.Dados).length !== periods.length) throw new Error('INE subsídios: resposta incompleta ou revisão divergente')
  return periods.map(p => {
    const rows = raw.Dados[p.categ_dsg]
    if (rows?.length !== 1 || rows[0].geocod !== 'PT' || rows[0].dim_3 !== 'T') throw new Error('INE subsídios: recorte inesperado')
    const row = rows[0]
    const value = row.valor === undefined || row.valor.trim() === '' ? null : Number(row.valor)
    if ((value === null && !row.sinal_conv) || (value !== null && (!/^\d+$/.test(row.valor!) || !Number.isSafeInteger(value)))) throw new Error('INE subsídios: contagem inválida')
    return { period: p.categ_dsg, value, ...(row.sinal_conv ? { status: row.sinal_conv } : {}), ...(row.sinal_conv_desc ? { comment: row.sinal_conv_desc } : {}) }
  })
}

export async function collectBenefits(previous?: Collection, fetcher: typeof fetch = fetch): Promise<Collection> {
  const lastAttemptAt = new Date().toISOString()
  try {
    const metadata = await fetchJsonWithRetry<IneMetadata[]>(BENEFITS_META, { fetcher })
    if (metadata.length !== 1) throw new Error('INE subsídios: metadados ausentes ou duplicados')
    const meta = metadata[0]
    const periods = benefitPeriods(meta)
    const requestUrl = `https://www.ine.pt/ine/json_indicador/pindica.jsp?op=2&varcd=0004348&lang=PT&Dim2=PT&Dim3=T&Dim1=${periods.map(p => p.categ_cod).join(',')}`
    const raw = await fetchJsonWithRetry<IneData[]>(requestUrl, { fetcher })
    if (raw.length !== 1) throw new Error('INE subsídios: resposta ausente ou duplicada')
    const points = parseBenefits(meta, raw[0])
    if (points.filter(p => p.value !== null).length < 30 || (previous && (points.length < previous.points.length
      || points.at(-1)!.period < previous.points.at(-1)!.period))) throw new Error('INE subsídios: perda de cobertura')
    return { fetchedAt: lastAttemptAt, lastAttemptAt, sourceUpdatedAt: meta.DataUltimaAtualizacao, cached: false,
      sourceUrl: 'https://www.ine.pt/xurl/indx/0004348/PT', methodologyUrl: BENEFITS_META,
      licenseUrl: 'https://dados.gov.pt/api/1/datasets/687042d38c1cd0da86630c9a/', requestUrl, sourceNote: meta.Nota, points }
  } catch (error) {
    if (!previous?.points.some(p => p.value !== null)) throw error
    console.warn(`INE subsídios indisponível; mantendo coleta anterior: ${String(error)}`)
    return { ...previous, cached: true, lastAttemptAt }
  }
}

export function benefitsCsv(data: Collection) {
  const cell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
  return [['ano', 'contagem_beneficiarios_por_subsidio', 'sinalizacao', 'observacao', 'nota_contagem', 'fonte', 'metadados', 'licenca', 'atualizacao_fonte', 'coleta', 'ultima_tentativa', 'coleta_anterior'],
    ...data.points.map(p => [p.period, p.value, p.status, p.comment, data.sourceNote, data.sourceUrl, data.methodologyUrl, data.licenseUrl, data.sourceUpdatedAt, data.fetchedAt, data.lastAttemptAt, data.cached])]
    .map(row => row.map(cell).join(',')).join('\n') + '\n'
}
