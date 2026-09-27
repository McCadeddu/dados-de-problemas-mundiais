import reviewed from '../data/forced-labour-2021.json' with { type: 'json' }

export type ForcedLabourEstimate = typeof reviewed
export const forcedLabourEstimate = reviewed

/** This is a reviewed edition, not a live series or a country-level prevalence model. */
export function validateForcedLabour(data: ForcedLabourEstimate) {
  if (data.referenceYear !== 2021 || data.publishedAt !== '2022-09-12'
    || data.documentUrl !== reviewed.documentUrl || data.sha256 !== reviewed.sha256
    || data.countUnit !== 'milhares de pessoas' || data.rateUnit !== 'pessoas por 1.000 habitantes'
    || data.period !== reviewed.period || data.population !== reviewed.population
    || data.license !== 'CC BY 4.0' || !data.adaptationNotice
    || !/^\d{4}-\d{2}-\d{2}$/.test(data.reviewedAt)) throw new Error('OIT: edição, unidade ou proveniência inválida')
  const count = (value: number) => Number.isSafeInteger(value) && value > 0
  const rate = (value: number) => Number.isFinite(value) && value > 0 && value <= 1000
  if (!count(data.world.countThousands) || !rate(data.world.perThousand)) throw new Error('OIT: total inválido')
  for (const [rows, expected] of [[data.categories, reviewed.categories], [data.regions, reviewed.regions]] as const) {
    if (rows.length !== expected.length || new Set(rows.map(r => r.id)).size !== rows.length
      || rows.some(r => !expected.some(e => e.id === r.id) || !count(r.countThousands))
      || rows.reduce((sum, r) => sum + r.countThousands, 0) !== data.world.countThousands) throw new Error('OIT: recortes incompletos ou total não reconciliado')
  }
  if (data.regions.some(r => !rate(r.perThousand))
    || data.tables.categories.number !== 1 || data.tables.categories.pdfPage !== 26 || data.tables.categories.printedPage !== 17
    || data.tables.regions.number !== 2 || data.tables.regions.pdfPage !== 27 || data.tables.regions.printedPage !== 18) throw new Error('OIT: taxas ou localização da fonte inválidas')
  return data
}

export function forcedLabourCsv(data: ForcedLabourEstimate = reviewed) {
  validateForcedLabour(data)
  const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const rows = [
    { kind: 'mundo', label: 'Mundo', ...data.world, table: data.tables.regions },
    ...data.categories.map(r => ({ ...r, kind: 'modalidade mundial', perThousand: null, table: data.tables.categories })),
    ...data.regions.map(r => ({ ...r, kind: 'região OIT', table: data.tables.regions })),
  ]
  return '\ufeff' + [['ano_referencia', 'recorte', 'nome', 'estimativa_milhares_pessoas', 'pessoas_por_1000_habitantes', 'periodo', 'denominador_taxa', 'autores', 'publicacao', 'revisao_edicao', 'fonte', 'tabela', 'pagina_impressa', 'pagina_pdf', 'sha256_documento', 'licenca', 'adaptacao'],
    ...rows.map(r => [data.referenceYear, r.kind, r.label, r.countThousands, r.perThousand, data.period, r.perThousand === null ? '' : data.population, data.authors, data.publishedAt, data.reviewedAt, data.documentUrl, r.table.number, r.table.printedPage, r.table.pdfPage, data.sha256, data.license, data.adaptationNotice])]
    .map(row => row.map(quote).join(',')).join('\r\n') + '\r\n'
}
