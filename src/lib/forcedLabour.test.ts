import { describe, expect, it } from 'vitest'
import Papa from 'papaparse'
import { forcedLabourEstimate, forcedLabourCsv, validateForcedLabour } from './forcedLabour'

describe('reviewed ILO forced labour estimate', () => {
  it('reconciles mutually exclusive categories and regions without adding nested totals', () => {
    const data = validateForcedLabour(structuredClone(forcedLabourEstimate))
    expect(data.categories.reduce((sum, r) => sum + r.countThousands, 0)).toBe(27577)
    expect(data.regions.reduce((sum, r) => sum + r.countThousands, 0)).toBe(27577)
    expect(data.world.perThousand).toBe(3.5)
  })
  it('rejects missing, duplicated or incompatible slices and units', () => {
    const mutations = [
      (d: typeof forcedLabourEstimate) => { d.countUnit = 'pessoas' },
      (d: typeof forcedLabourEstimate) => { d.rateUnit = '%' },
      (d: typeof forcedLabourEstimate) => { d.referenceYear = 2026 },
      (d: typeof forcedLabourEstimate) => { d.regions.pop() },
      (d: typeof forcedLabourEstimate) => { d.regions[0] = d.regions[1] },
      (d: typeof forcedLabourEstimate) => { d.categories[0].countThousands = -1 },
      (d: typeof forcedLabourEstimate) => { d.regions[0].perThousand = NaN },
      (d: typeof forcedLabourEstimate) => { d.tables.regions.pdfPage = 18 },
    ]
    for (const change of mutations) { const data = structuredClone(forcedLabourEstimate); change(data); expect(() => validateForcedLabour(data)).toThrow() }
  })
  it('exports all slices with original units and provenance; no invented category rates', () => {
    const result = Papa.parse<Record<string, string>>(forcedLabourCsv(), { header: true, skipEmptyLines: true })
    expect(result.errors).toEqual([])
    expect(result.data).toHaveLength(9)
    expect(result.data[0]).toMatchObject({ ano_referencia: '2021', estimativa_milhares_pessoas: '27577', pessoas_por_1000_habitantes: '3.5', pagina_pdf: '27', licenca: 'CC BY 4.0' })
    expect(result.data.filter(r => r.recorte === 'modalidade mundial').every(r => r.pessoas_por_1000_habitantes === '')).toBe(true)
    expect(result.data.every(r => r.sha256_documento.length === 64 && r.adaptacao.includes('não é endossada'))).toBe(true)
  })
})
