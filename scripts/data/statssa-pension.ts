import { readFile } from 'node:fs/promises'
import type { SouthAfricaPension } from '../../src/types.js'

export const PENSION_INDICATOR_ID = 'statssa-employer-pension-contribution'
export const PENSION_DOCUMENT = 'https://www.statssa.gov.za/publications/Report-02-11-02/Report-02-11-022024.pdf'

/** Validate a reviewed edition; do not silently combine it with future QLFS definitions. */
export function parseStatsSaPension(raw: unknown): SouthAfricaPension {
  const data = raw as SouthAfricaPension
  if (!data || data.edition !== 'Labour Market Dynamics in South Africa, 2024'
    || data.publishedAt !== '2025-12-10' || !/^\d{4}-\d{2}-\d{2}$/.test(data.reviewedAt)
    || data.documentUrl !== PENSION_DOCUMENT
    || data.sourceUrl !== 'https://www.statssa.gov.za/?PPN=Report-02-11-02&page_id=1854'
    || !/^[a-f0-9]{64}$/.test(data.sha256) || typeof data.license !== 'string' || !data.license.trim()
    || data.table !== '3.28' || data.printedPage !== 160 || data.pdfPage !== 161
    || data.geographyCode !== 'ZAF' || data.measure !== 'employer-pension-contribution'
    || data.unit !== '%' || data.population !== 'employees' || data.ageRange !== '15-64'
    || data.aggregation !== 'annual-qlfs') throw new Error('Stats SA pensão: edição, conceito ou proveniência inválida')
  if (!Array.isArray(data.points) || data.points.length !== 6) throw new Error('Stats SA pensão: histórico incompleto')
  data.points.forEach((point, index) => {
    if (!point || point.year !== 2019 + index
      || [point.bothSexes, point.men, point.women].some((value) => typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100)
      || point.bothSexes < Math.min(point.men, point.women) - 0.1
      || point.bothSexes > Math.max(point.men, point.women) + 0.1) {
      throw new Error('Stats SA pensão: ano omitido/duplicado ou percentual ausente/incompatível')
    }
  })
  return data
}

export async function loadStatsSaPension(): Promise<SouthAfricaPension> {
  return parseStatsSaPension(JSON.parse(await readFile('scripts/data/sources/statssa-pension-2024.json', 'utf8')))
}

export function pensionCsv(data: SouthAfricaPension): string {
  const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
  return [['ano', 'ambos_os_sexos', 'homens', 'mulheres', 'unidade', 'denominador', 'medida', 'edicao', 'publicacao', 'fonte'],
    ...data.points.map((point) => [point.year, point.bothSexes, point.men, point.women, '%', 'empregados de 15 a 64 anos; cada sexo no seu grupo', 'contribuição do empregador para aposentadoria', data.edition, data.publishedAt, data.documentUrl]),
  ].map((row) => row.map(quote).join(',')).join('\r\n') + '\r\n'
}
