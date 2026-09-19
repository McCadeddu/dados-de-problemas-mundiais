import type { Indicator, Series } from '../../src/types.js'

export type Config = Omit<Indicator, 'latestYear'> & { code: string; complement?: boolean }
const common = { unit: '%', geographyType: 'country', direction: 'higher-worse' } as const
export const EDUCATION_WORK_INDICATORS: Config[] = [
  { ...common, id: 'uis-adult-illiteracy', code: 'SE.ADT.LITR.ZS', complement: true, name: 'Analfabetismo — 15 anos ou mais', themeId: 'illiteracy', sourceId: 'uis-literacy', description: 'Percentual de pessoas de 15 anos ou mais que não sabem ler e escrever com compreensão uma frase simples sobre a vida cotidiana. Derivado como 100 menos a taxa de alfabetização UNESCO/UIS distribuída pelo Banco Mundial; não mede analfabetismo funcional.' },
  { ...common, id: 'uis-youth-illiteracy', code: 'SE.ADT.1524.LT.ZS', complement: true, name: 'Analfabetismo entre jovens — 15 a 24 anos', themeId: 'illiteracy', sourceId: 'uis-youth-literacy', description: 'Percentual de jovens de 15 a 24 anos não alfabetizados, calculado como 100 menos a taxa de alfabetização UNESCO/UIS distribuída pelo Banco Mundial. Não mede frequência escolar nem aprendizagem funcional.' },
  { ...common, id: 'ilo-unemployment', code: 'SL.UEM.TOTL.ZS', name: 'Desemprego — estimativa OIT', themeId: 'decent-work', sourceId: 'ilo-unemployment', description: 'Pessoas sem trabalho, disponíveis e procurando emprego, como percentual da força de trabalho. Estimativa modelada da OIT distribuída pelo Banco Mundial; não inclui toda a população fora da força de trabalho.' },
  { ...common, id: 'ilo-youth-unemployment', code: 'SL.UEM.1524.ZS', name: 'Desemprego juvenil — 15 a 24 anos', themeId: 'decent-work', sourceId: 'ilo-youth-unemployment', description: 'Jovens de 15 a 24 anos sem trabalho, disponíveis e procurando emprego, como percentual da força de trabalho dessa idade. Estimativa modelada OIT; não é o percentual de todos os jovens sem emprego.' },
  { ...common, id: 'ilo-vulnerable-employment', code: 'SL.EMP.VULN.ZS', name: 'Emprego vulnerável', themeId: 'decent-work', sourceId: 'ilo-vulnerable-employment', description: 'Trabalhadores por conta própria e trabalhadores familiares auxiliares como percentual do emprego total. É uma medida internacional de vulnerabilidade ocupacional; não equivale à informalidade nem prova ausência de contribuição previdenciária.' },
]

export function percentage(value: unknown, complement = false): number | null {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null
  if (typeof value === 'string' && !/^\d+(\.\d+)?$/.test(value)) return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0 || number > 100) return null
  return complement ? Math.round((100 - number) * 1e8) / 1e8 : number
}

export type IbgeRow = { localidade: { id: string; nome: string }; serie: Record<string, string> }
export function parseIbgeSeries(rows: IbgeRow[], indicatorId: string, fourthQuarter: boolean): Series[] {
  return rows.flatMap((row) => {
    const points = Object.entries(row.serie).flatMap(([period, raw]) => {
      if (fourthQuarter ? !/^\d{4}04$/.test(period) : !/^\d{4}$/.test(period)) return []
      const value = percentage(raw)
      return value === null ? [] : [{ year: Number(period.slice(0, 4)), value }]
    }).sort((a, b) => a.year - b.year)
    return points.length ? [{ indicatorId, geographyType: 'brazil-state' as const, geographyCode: row.localidade.id, geographyName: row.localidade.nome, points }] : []
  })
}
