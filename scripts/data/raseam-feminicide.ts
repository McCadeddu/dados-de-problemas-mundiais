import type { DashboardData, Indicator, Series, Source } from '../../src/types.js'
import { FEMINICIDE_COUNT_ID, FEMINICIDE_RATE_ID, RASEAM_URL } from '../../src/lib/feminicide.js'
import { STATE_CODES } from './ibge-food-security-states.js'

type RecordRow = { code: string; name: string; victims: number; femalePopulation: number; rate: number }
export type FeminicideEdition = {
  edition: string; sourceUpdatedAt: string; reviewedAt: string; sourceUrl: string; sha256: string; license: string
  tables: Array<{ year: number; table: string; printedPage: number; pdfPage: number; records: RecordRow[] }>
}

// This is a reviewed publication, not a live Sinesp feed. A new edition requires review.
export function parseFeminicideEdition(raw: unknown): FeminicideEdition {
  const edition = raw as FeminicideEdition
  if (!edition || edition.edition !== 'RASEAM 2026' || edition.sourceUpdatedAt !== '2026-02-20'
    || edition.sourceUrl !== RASEAM_URL || !/^\d{4}-\d{2}-\d{2}$/.test(edition.reviewedAt)
    || !/^[a-f0-9]{64}$/.test(edition.sha256) || !edition.license?.trim()
    || !Array.isArray(edition.tables) || edition.tables.length !== 2) throw new Error('RASEAM: edição ou proveniência inválida')
  for (const [index, year] of [2024, 2025].entries()) {
    const table = edition.tables[index]
    const pdfPage = year === 2024 ? 460 : 459
    if (table.year !== year || table.table !== (year === 2024 ? '5.37b' : '5.37a')
      || table.pdfPage !== pdfPage || table.printedPage !== pdfPage + 8
      || !Array.isArray(table.records) || table.records.length !== 28) throw new Error('RASEAM: tabela ou cobertura inválida')
    const codes = new Set<string>()
    for (const row of table.records) {
      if (!row || !['BRA', ...STATE_CODES].includes(row.code) || codes.has(row.code) || !row.name?.trim()
        || !Number.isSafeInteger(row.victims) || row.victims < 0
        || !Number.isSafeInteger(row.femalePopulation) || row.femalePopulation <= 0
        || typeof row.rate !== 'number' || !Number.isFinite(row.rate) || row.rate < 0
        || Math.round(row.victims / row.femalePopulation * 1e6) / 10 !== row.rate) {
        throw new Error('RASEAM: UF duplicada, valor ausente ou taxa incompatível com o denominador')
      }
      codes.add(row.code)
    }
    const national = table.records.find((row) => row.code === 'BRA')!
    const states = table.records.filter((row) => row.code !== 'BRA')
    if (national.victims !== (year === 2024 ? 1494 : 1548)
      || states.reduce((sum, row) => sum + row.victims, 0) !== national.victims
      || states.reduce((sum, row) => sum + row.femalePopulation, 0) !== national.femalePopulation) {
      throw new Error('RASEAM: totais estaduais não conferem com a publicação')
    }
  }
  return edition
}

export function feminicideSeries(edition: FeminicideEdition): Series[] {
  return [FEMINICIDE_RATE_ID, FEMINICIDE_COUNT_ID].flatMap((indicatorId) => STATE_CODES.map((code) => ({
    indicatorId, geographyType: 'brazil-state' as const, geographyCode: code,
    geographyName: edition.tables[0].records.find((row) => row.code === code)!.name,
    points: edition.tables.map((table) => {
      const row = table.records.find((item) => item.code === code)!
      return { year: table.year, value: indicatorId === FEMINICIDE_RATE_ID ? row.rate : row.victims }
    }),
  })))
}

export function integrateFeminicide(data: DashboardData, raw: unknown): DashboardData {
  const edition = parseFeminicideEdition(raw)
  const series = feminicideSeries(edition)
  const source: Source = {
    id: 'raseam-feminicide-2026', name: 'Ministério das Mulheres — RASEAM 2026 / MJSP / IBGE',
    url: RASEAM_URL, methodologyUrl: `${RASEAM_URL}#page=459`, license: edition.license,
    lastUpdated: `Edição RASEAM 2026; dados atualizados na fonte em 20/02/2026. Tabelas 5.37a–b, referências 2024–2025. Edição revisada em ${edition.reviewedAt}; não é uma coleta em tempo real.`,
  }
  const description = 'Mulheres vítimas de feminicídio consumado registradas nos Dados Nacionais de Segurança Pública/MJSP, conforme as tabelas 5.37a–b do RASEAM 2026. Referências 2024–2025; atualização da fonte em 20/02/2026. Dados sujeitos a revisões, diferenças de registro e classificação; não medem toda a violência contra mulheres nem a prevalência de violência por parceiro íntimo.'
  const indicators: Indicator[] = [
    { id: FEMINICIDE_RATE_ID, name: 'Feminicídio registrado — taxa por 100 mil mulheres', themeId: 'gender-equality', geographyType: 'brazil-state', sourceId: source.id, latestYear: 2025, direction: 'higher-worse', unit: 'por 100 mil mulheres', description: `${description} Taxa publicada com uma casa decimal: vítimas / população feminina da UF no mesmo ano × 100.000 (IBGE, projeção revisada em 2024). Taxa bruta, sem padronização por idade; empates podem decorrer do arredondamento.` },
    { id: FEMINICIDE_COUNT_ID, name: 'Feminicídio registrado — mulheres vítimas', themeId: 'gender-equality', geographyType: 'brazil-state', sourceId: source.id, latestYear: 2025, direction: 'neutral', unit: 'vítimas', description: `${description} Contagem absoluta, sem denominador. Estados mais populosos podem ter contagens maiores; a posição por quantidade não compara risco individual.` },
  ]
  const ids = new Set(indicators.map((item) => item.id))
  const latest = series.map((entry) => ({ indicatorId: entry.indicatorId, geographyType: entry.geographyType, geographyCode: entry.geographyCode, geographyName: entry.geographyName, ...entry.points.at(-1)! }))
  return { ...data,
    indicators: [...data.indicators.filter((item) => !ids.has(item.id)), ...indicators],
    sources: [...data.sources.filter((item) => item.id !== source.id), source],
    latest: [...data.latest.filter((item) => !ids.has(item.indicatorId)), ...latest],
    rankings: [...data.rankings.filter((item) => !ids.has(item.indicatorId)), ...indicators.map((indicator) => ({ indicatorId: indicator.id, geographyType: indicator.geographyType, year: indicator.latestYear, items: latest.filter((item) => item.indicatorId === indicator.id).sort((a, b) => b.value - a.value || a.geographyCode.localeCompare(b.geographyCode)) }))],
  }
}
