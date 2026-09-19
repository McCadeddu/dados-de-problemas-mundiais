import { afterEach, describe, expect, it, vi } from 'vitest'
import { collectIneUnemployment, inePeriods, parseIneUnemployment, type IneMetadata, type IneData } from './ine-portugal.js'

function fixture(count = 2) {
  const periods = Array.from({ length: count }, (_, i) => ({ dim_num: '1', categ_cod: `S5A${2011 + Math.floor(i / 4)}${i % 4 + 1}`, categ_dsg: `${i % 4 + 1}.º Trimestre de ${2011 + Math.floor(i / 4)}` }))
  const meta: IneMetadata = {
    IndicadorCod: '0012136', Periodic: 'Trimestral', UnidadeMedida: 'Percentagem (%)', Potencia10: '0', PrecisaoDecimal: '1',
    DataUltimaAtualizacao: '2026-08-05', Nota: 'Estimativas revistas pelo INE.', PrimeiroPeriodo: periods[0].categ_dsg, UltimoPeriodo: periods.at(-1)!.categ_dsg,
    Dimensoes: { Descricao_Dim: [{ dim_num: '1', versao: 'XXXXX' }, { dim_num: '2', versao: '05257' }, { dim_num: '3', versao: '00305' }], Categoria_Dim: [{
      periods, country: [{ dim_num: '2', categ_cod: 'PT', categ_dsg: 'Portugal' }], sex: [{ dim_num: '3', categ_cod: 'T', categ_dsg: 'HM' }],
    }] },
  }
  const raw: IneData = { IndicadorCod: '0012136', DataUltimoAtualizacao: '2026-08-05', Dados: Object.fromEntries(periods.map((p) => [p.categ_dsg, [{ geocod: 'PT', dim_3: 'T', valor: '5.3' }]])) }
  return { meta, raw }
}
afterEach(() => vi.restoreAllMocks())

describe('INE Portugal unemployment', () => {
  it('preserves real zero, missing observations and official flags', () => {
    const { meta, raw } = fixture()
    raw.Dados[meta.PrimeiroPeriodo][0].valor = '0'
    raw.Dados[meta.UltimoPeriodo][0] = { geocod: 'PT', dim_3: 'T', sinal_conv: 'x', sinal_conv_desc: 'Dado não disponível' }
    expect(parseIneUnemployment(meta, raw)).toEqual([
      { period: '2011-Q1', value: 0 }, { period: '2011-Q2', value: null, status: 'x', comment: 'Dado não disponível' },
    ])
  })
  it('rejects metadata changes that invalidate comparability', () => {
    for (const change of [{ Periodic: 'Anual' }, { Potencia10: '3' }, { IndicadorCod: '0012173' }, { UnidadeMedida: 'Número' }, { Nota: '' }]) {
      expect(() => inePeriods({ ...fixture().meta, ...change })).toThrow()
    }
    const { meta } = fixture()
    meta.Dimensoes.Descricao_Dim[1].versao = 'old-NUTS'
    expect(() => inePeriods(meta)).toThrow(/dimensões/)
  })
  it('rejects regional or sex-specific results, duplicates and silently omitted periods', () => {
    for (const change of [{ geocod: '1' }, { dim_3: '1' }, { valor: '101' }, { valor: 'NaN' }, { valor: '' }]) {
      const { meta, raw } = fixture()
      Object.assign(raw.Dados[meta.PrimeiroPeriodo][0], change)
      expect(() => parseIneUnemployment(meta, raw)).toThrow()
    }
    const { meta, raw } = fixture()
    raw.Dados[meta.PrimeiroPeriodo].push(raw.Dados[meta.PrimeiroPeriodo][0])
    expect(() => parseIneUnemployment(meta, raw)).toThrow(/duplicado/)
    delete raw.Dados[meta.PrimeiroPeriodo]
    expect(() => parseIneUnemployment(meta, raw)).toThrow(/incompleta/)
  })
  it('rejects a metadata/data release mismatch and invalid period codes', () => {
    const { meta, raw } = fixture()
    raw.DataUltimoAtualizacao = '2026-05-01'
    expect(() => parseIneUnemployment(meta, raw)).toThrow(/versão/)
    meta.Dimensoes.Categoria_Dim[0].periods[0].categ_cod = 'S5A20115'
    expect(() => inePeriods(meta)).toThrow(/períodos/)
  })
  it('collects the complete metadata-listed history and retains a valid snapshot on failure', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { meta, raw } = fixture(62)
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json([meta])).mockResolvedValueOnce(Response.json([raw]))
    const fresh = await collectIneUnemployment(undefined, fetcher)
    expect(fresh.points).toHaveLength(62)
    expect(fresh.points.at(-1)).toEqual({ period: '2026-Q2', value: 5.3 })
    expect(fresh.requestUrl).toContain('Dim2=PT&Dim3=T&Dim1=S5A20111')
    expect(fresh.cached).toBe(false)
    const badFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 404 }))
    const cached = await collectIneUnemployment(fresh, badFetch)
    expect(cached).toMatchObject({ cached: true, fetchedAt: fresh.fetchedAt, sourceUpdatedAt: fresh.sourceUpdatedAt, points: fresh.points })
    await expect(collectIneUnemployment(undefined, badFetch)).rejects.toThrow(/404/)
  })
})
