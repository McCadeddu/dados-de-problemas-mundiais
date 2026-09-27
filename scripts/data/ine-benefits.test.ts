import { describe, expect, it, vi } from 'vitest'
import { benefitPeriods, parseBenefits, collectBenefits, benefitsCsv } from './ine-benefits.js'
import type { IneMetadata, IneData } from './ine-portugal.js'

function fixture() {
  const periods = Array.from({ length: 36 }, (_, i) => ({ dim_num: '1', categ_cod: `S7A${1990 + i}`, categ_dsg: String(1990 + i) }))
  const meta: IneMetadata = { IndicadorCod: '0004348', Periodic: 'Anual', UnidadeMedida: 'Número (N.º)', Potencia10: '0', PrecisaoDecimal: '0',
    DataUltimaAtualizacao: '2026-07-04', Nota: 'Contados por subsídio recebido.', PrimeiroPeriodo: '1990', UltimoPeriodo: '2025',
    Dimensoes: { Descricao_Dim: [{ dim_num: '1', versao: 'XXXXX' }, { dim_num: '2', versao: '05361' }, { dim_num: '3', versao: '00305' }],
      Categoria_Dim: [{ periods, country: [{ dim_num: '2', categ_cod: 'PT', categ_dsg: 'Portugal' }], sex: [{ dim_num: '3', categ_cod: 'T', categ_dsg: 'HM' }] }] } }
  const raw: IneData = { IndicadorCod: meta.IndicadorCod, DataUltimoAtualizacao: meta.DataUltimaAtualizacao,
    Dados: Object.fromEntries(periods.map(p => [p.categ_dsg, [{ geocod: 'PT', dim_3: 'T', valor: '123456' }]])) }
  return { meta, raw }
}

describe('Portugal unemployment benefits', () => {
  it('preserves counts, real zeros, missing values and source flags', () => {
    const { meta, raw } = fixture()
    raw.Dados['1990'][0].valor = '0'
    raw.Dados['1991'][0] = { geocod: 'PT', dim_3: 'T', sinal_conv: 'x', sinal_conv_desc: 'Não disponível' }
    expect(parseBenefits(meta, raw).slice(0, 3)).toEqual([{ period: '1990', value: 0 }, { period: '1991', value: null, status: 'x', comment: 'Não disponível' }, { period: '1992', value: 123456 }])
  })
  it('rejects changed units, geography, frequency and incomplete years', () => {
    for (const change of [{ UnidadeMedida: '%' }, { Potencia10: '3' }, { Periodic: 'Mensal' }, { Nota: '' }]) expect(() => benefitPeriods({ ...fixture().meta, ...change })).toThrow()
    const { meta } = fixture()
    meta.Dimensoes.Categoria_Dim[0].periods.splice(10, 1)
    expect(() => benefitPeriods(meta)).toThrow()
    for (const change of [{ geocod: '1' }, { dim_3: '1' }, { valor: '-1' }, { valor: '1.5' }, { valor: '' }]) {
      const f = fixture(); Object.assign(f.raw.Dados['1990'][0], change)
      expect(() => parseBenefits(f.meta, f.raw)).toThrow()
    }
  })
  it('rejects duplicates and mismatched revisions', () => {
    const { meta, raw } = fixture()
    raw.Dados['1990'].push(raw.Dados['1990'][0])
    expect(() => parseBenefits(meta, raw)).toThrow()
    expect(() => parseBenefits(meta, { ...fixture().raw, DataUltimoAtualizacao: '2025-07-04' })).toThrow()
  })
  it('collects all years, exports provenance and keeps the previous collection on invalid data', async () => {
    const { meta, raw } = fixture()
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify([meta]))).mockResolvedValueOnce(new Response(JSON.stringify([raw])))
    const data = await collectBenefits(undefined, fetcher)
    expect(fetcher.mock.calls[1][0]).toContain('Dim2=PT&Dim3=T&Dim1=S7A1990')
    expect(data.points).toHaveLength(36)
    expect(benefitsCsv(data)).toContain(meta.Nota)
    expect(benefitsCsv(data)).toContain(data.licenseUrl)
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const invalid = vi.fn().mockResolvedValue(new Response('[]'))
    expect(await collectBenefits(data, invalid)).toMatchObject({ cached: true, fetchedAt: data.fetchedAt, points: data.points })
    await expect(collectBenefits(undefined, vi.fn().mockResolvedValue(new Response('[]')))).rejects.toThrow()
    warning.mockRestore()
  })
})
