import AdmZip from 'adm-zip'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import Papa from 'papaparse'
import { withCachedFallback } from './resilience.js'

type ThemeId =
  | 'hunger-water'
  | 'gender-equality'
  | 'poverty-inequality'
  | 'climate-vulnerability'
  | 'forced-migration'

type GeographyType = 'country' | 'brazil-state' | 'brazil-immediate-region'

type Source = {
  id: string
  name: string
  url: string
  methodologyUrl: string
  license: string
  lastUpdated: string
}

type Indicator = {
  id: string
  name: string
  themeId: ThemeId
  description: string
  unit: string
  geographyType: GeographyType
  sourceId: string
  direction: 'higher-better' | 'higher-worse' | 'neutral'
  latestYear: number
}

type DataPoint = { year: number; value: number }

type Series = {
  indicatorId: string
  geographyType: GeographyType
  geographyCode: string
  geographyName: string
  points: DataPoint[]
}

type LatestValue = {
  indicatorId: string
  geographyType: GeographyType
  geographyCode: string
  geographyName: string
  year: number
  value: number
}

type Ranking = {
  indicatorId: string
  geographyType: GeographyType
  year: number
  items: LatestValue[]
}

type DashboardData = {
  generatedAt: string
  themes: Array<{ id: ThemeId; name: string; description: string }>
  indicators: Indicator[]
  sources: Source[]
  countries: Array<{ code: string; name: string; continent: string }>
  continents: string[]
  brazilStates: Array<{ code: string; name: string }>
  brazilImmediateRegions: Array<{ code: string; name: string; stateCode: string }>
  series: Series[]
  latest: LatestValue[]
  rankings: Ranking[]
  countryPopulation: Array<{
    geographyCode: string
    points: DataPoint[]
  }>
  worldPopulation?: { value: number; referenceYear: number; annualChange: number; sourceId: string }
  notes: string[]
}

type WorldBankIndicatorConfig = Omit<Indicator, 'latestYear'> & {
  wbCode: string
}

type WorldBankGapIndicatorConfig = Omit<Indicator, 'latestYear'> & {
  femaleCode: string
  maleCode: string
}

const ROOT = process.cwd()
const PUBLIC_DATA_DIR = path.join(ROOT, 'public', 'data')
const PUBLIC_SERIES_DIR = path.join(PUBLIC_DATA_DIR, 'series')
const RAW_DIR = path.join(ROOT, 'data', 'raw')

const THEMES: DashboardData['themes'] = [
  {
    id: 'hunger-water',
    name: 'Fome e sede',
    description: 'Insegurança alimentar e acesso básico à água potável.',
  },
  {
    id: 'gender-equality',
    name: 'Discriminação social e desigualdade de gênero',
    description: 'Participação econômica e representação política de mulheres.',
  },
  {
    id: 'poverty-inequality',
    name: 'Pobreza, riqueza e desigualdade',
    description: 'Pobreza monetária e concentração de renda.',
  },
  {
    id: 'climate-vulnerability',
    name: 'Vulnerabilidade às mudanças climáticas',
    description: 'Exposição, sensibilidade e prontidão para adaptação.',
  },
  {
    id: 'forced-migration',
    name: 'Migração por sobrevivência e crises',
    description: 'Deslocamento forçado associado a conflito e crise humanitária.',
  },
]

const WORLD_BANK_SOURCE_ID = 'world-bank'
const ND_GAIN_SOURCE_ID = 'nd-gain'
const UNHCR_SOURCE_ID = 'unhcr'
const SIDRA_SOURCE_ID = 'ibge-sidra'
const IBGE_POF_SOURCE_ID = 'ibge-pof'
const INPE_QUEIMADAS_SOURCE_ID = 'inpe-queimadas'
const INPE_IBGE_FIRE_RATE_SOURCE_ID = 'inpe-ibge-fire-rate'
const SISMIGRA_SOURCE_ID = 'sismigra'
const NATURAL_EARTH_SOURCE_ID = 'natural-earth'
const BRAZIL_STATE_CODE_BY_POSTAL: Record<string, string> = {
  AC: '12',
  AL: '27',
  AM: '13',
  AP: '16',
  BA: '29',
  CE: '23',
  DF: '53',
  ES: '32',
  GO: '52',
  MA: '21',
  MG: '31',
  MS: '50',
  MT: '51',
  PA: '15',
  PB: '25',
  PE: '26',
  PI: '22',
  PR: '41',
  RJ: '33',
  RN: '24',
  RO: '11',
  RR: '14',
  RS: '43',
  SC: '42',
  SE: '28',
  SP: '35',
  TO: '17',
}

const WORLD_BANK_INDICATORS: WorldBankIndicatorConfig[] = [
  {
    id: 'wb-undernourishment',
    wbCode: 'SN.ITK.DEFC.ZS',
    name: 'Subalimentação',
    themeId: 'hunger-water',
    description: 'Prevalência de subalimentação (% da população).',
    unit: '%',
    geographyType: 'country',
    sourceId: WORLD_BANK_SOURCE_ID,
    direction: 'higher-worse',
  },
  {
    id: 'wb-moderate-severe-food-insecurity',
    wbCode: 'SN.ITK.MSFI.ZS',
    name: 'Insegurança alimentar moderada ou grave',
    themeId: 'hunger-water',
    description: 'População em domicílios expostos a dietas de baixa qualidade ou redução na quantidade de alimentos por falta de recursos (%).',
    unit: '%',
    geographyType: 'country',
    sourceId: WORLD_BANK_SOURCE_ID,
    direction: 'higher-worse',
  },
  {
    id: 'wb-basic-water',
    wbCode: 'SH.H2O.BASW.ZS',
    name: 'Acesso básico à água',
    themeId: 'hunger-water',
    description: 'População com acesso a serviços básicos de água potável (%).',
    unit: '%',
    geographyType: 'country',
    sourceId: WORLD_BANK_SOURCE_ID,
    direction: 'higher-better',
  },
  {
    id: 'wb-safely-managed-water',
    wbCode: 'SH.H2O.SMDW.ZS',
    name: 'Água potável gerida com segurança',
    themeId: 'hunger-water',
    description: 'População com água de fonte melhorada, disponível quando necessária, acessível no domicílio e livre de contaminação prioritária (%).',
    unit: '%',
    geographyType: 'country',
    sourceId: WORLD_BANK_SOURCE_ID,
    direction: 'higher-better',
  },
  {
    id: 'wb-women-parliament',
    wbCode: 'SG.GEN.PARL.ZS',
    name: 'Mulheres no parlamento',
    themeId: 'gender-equality',
    description: 'Cadeiras ocupadas por mulheres em parlamentos nacionais (%).',
    unit: '%',
    geographyType: 'country',
    sourceId: WORLD_BANK_SOURCE_ID,
    direction: 'higher-better',
  },
  {
    id: 'wb-female-labor',
    wbCode: 'SL.TLF.CACT.FE.ZS',
    name: 'Participação feminina na força de trabalho',
    themeId: 'gender-equality',
    description: 'Participação feminina na força de trabalho (% da população feminina 15+).',
    unit: '%',
    geographyType: 'country',
    sourceId: WORLD_BANK_SOURCE_ID,
    direction: 'higher-better',
  },
  {
    id: 'wb-women-violence-recent',
    wbCode: 'SG.VAW.1549.ZS',
    name: 'Mulheres sujeitas a violência física e/ou sexual recente',
    themeId: 'gender-equality',
    description: 'Mulheres de 15 a 49 anos que sofreram violência física e/ou sexual por parceiro íntimo ou não parceiro nos últimos 12 meses (%).',
    unit: '%',
    geographyType: 'country',
    sourceId: WORLD_BANK_SOURCE_ID,
    direction: 'higher-worse',
  },
  {
    id: 'wb-poverty-685',
    wbCode: 'SI.POV.UMIC',
    name: 'Pobreza na linha de US$ 6,85/dia',
    themeId: 'poverty-inequality',
    description: 'Taxa de pobreza na linha de US$ 6,85 PPC de 2017 (% da população).',
    unit: '%',
    geographyType: 'country',
    sourceId: WORLD_BANK_SOURCE_ID,
    direction: 'higher-worse',
  },
  {
    id: 'wb-gini',
    wbCode: 'SI.POV.GINI',
    name: 'Índice de Gini',
    themeId: 'poverty-inequality',
    description: 'Índice de desigualdade de renda.',
    unit: 'índice',
    geographyType: 'country',
    sourceId: WORLD_BANK_SOURCE_ID,
    direction: 'higher-worse',
  },
]

const WORLD_BANK_GAP_INDICATORS: WorldBankGapIndicatorConfig[] = [
  {
    id: 'wb-labor-participation-gap',
    femaleCode: 'SL.TLF.CACT.FE.ZS',
    maleCode: 'SL.TLF.CACT.MA.ZS',
    name: 'Diferença de participação na força de trabalho',
    themeId: 'gender-equality',
    description: 'Diferença entre a participação masculina e feminina na força de trabalho (homens menos mulheres, em pontos percentuais).',
    unit: 'p.p.',
    geographyType: 'country',
    sourceId: WORLD_BANK_SOURCE_ID,
    direction: 'higher-worse',
  },
  {
    id: 'wb-unpaid-care-gap',
    femaleCode: 'SG.TIM.UWRK.FE',
    maleCode: 'SG.TIM.UWRK.MA',
    name: 'Diferença de tempo em cuidado não remunerado',
    themeId: 'gender-equality',
    description: 'Diferença entre o tempo diário feminino e masculino dedicado a trabalho doméstico e de cuidado não remunerado (pontos percentuais de 24 horas).',
    unit: 'p.p.',
    geographyType: 'country',
    sourceId: WORLD_BANK_SOURCE_ID,
    direction: 'higher-worse',
  },
]

type UnhcrIndicatorConfig = Omit<Indicator, 'latestYear'> & {
  field: 'refugees' | 'asylum_seekers' | 'idps'
  perspective: 'origin' | 'asylum'
}

const UNHCR_INDICATORS: UnhcrIndicatorConfig[] = [
  {
    id: 'unhcr-refugees-origin',
    name: 'Refugiados por país de origem',
    themeId: 'forced-migration',
    description: 'Pessoas refugiadas ou em situação semelhante, segundo o país de origem.',
    unit: 'pessoas',
    geographyType: 'country',
    sourceId: UNHCR_SOURCE_ID,
    direction: 'higher-worse',
    field: 'refugees',
    perspective: 'origin',
  },
  {
    id: 'unhcr-refugees-hosted',
    name: 'Refugiados acolhidos',
    themeId: 'forced-migration',
    description: 'Pessoas refugiadas ou em situação semelhante acolhidas pelo país de asilo.',
    unit: 'pessoas',
    geographyType: 'country',
    sourceId: UNHCR_SOURCE_ID,
    direction: 'higher-worse',
    field: 'refugees',
    perspective: 'asylum',
  },
  {
    id: 'unhcr-asylum-seekers-hosted',
    name: 'Solicitantes de asilo acolhidos',
    themeId: 'forced-migration',
    description: 'Pessoas com pedido de proteção internacional ainda não decidido, segundo o país de asilo.',
    unit: 'pessoas',
    geographyType: 'country',
    sourceId: UNHCR_SOURCE_ID,
    direction: 'higher-worse',
    field: 'asylum_seekers',
    perspective: 'asylum',
  },
  {
    id: 'unhcr-conflict-idps-origin',
    name: 'Deslocados internos acompanhados pela UNHCR',
    themeId: 'forced-migration',
    description: 'Deslocados internos por conflito ou violência sob proteção ou assistência da UNHCR; não representa o total global de deslocamento interno.',
    unit: 'pessoas',
    geographyType: 'country',
    sourceId: UNHCR_SOURCE_ID,
    direction: 'higher-worse',
    field: 'idps',
    perspective: 'origin',
  },
]

const BRAZIL_STATE_INDICATOR: Omit<Indicator, 'latestYear'> & {
  sidraTable: string
  sidraVariable: string
} = {
  id: 'sidra-bolsa-familia',
  sidraTable: '7447',
  sidraVariable: '10784',
  name: 'Pessoas em domicílios com Bolsa Família',
  themeId: 'poverty-inequality',
  description:
    'Pessoas de 10 anos ou mais que vivem em domicílios com algum morador beneficiário do Bolsa Família.',
  unit: 'mil pessoas',
  geographyType: 'brazil-state',
  sourceId: SIDRA_SOURCE_ID,
  direction: 'higher-worse',
}

const BRAZIL_STATE_GINI_INDICATOR: Omit<Indicator, 'latestYear'> = {
  id: 'ibge-state-gini-2022',
  name: 'Índice de Gini da renda domiciliar per capita',
  themeId: 'poverty-inequality',
  description: 'Desigualdade da distribuição do rendimento mensal domiciliar per capita, segundo o Censo Demográfico 2022.',
  unit: 'índice 0-1',
  geographyType: 'brazil-state',
  sourceId: SIDRA_SOURCE_ID,
  direction: 'higher-worse',
}

const BRAZIL_STATE_INCOME_INDICATOR: Omit<Indicator, 'latestYear'> = {
  id: 'ibge-state-real-income-per-capita',
  name: 'Rendimento domiciliar per capita real',
  themeId: 'poverty-inequality',
  description: 'Rendimento médio mensal real domiciliar per capita, a preços médios do último ano, da PNAD Contínua anual.',
  unit: 'R$',
  geographyType: 'brazil-state',
  sourceId: SIDRA_SOURCE_ID,
  direction: 'higher-better',
}

const BRAZIL_STATE_MULTIDIMENSIONAL_POVERTY_INDICATOR: Omit<Indicator, 'latestYear'> = {
  id: 'ibge-pof-multidimensional-poverty',
  name: 'Pessoas com pobreza multidimensional',
  themeId: 'poverty-inequality',
  description: 'Proporção de pessoas das famílias com algum grau de pobreza multidimensional não monetária, medida experimental da POF 2017-2018.',
  unit: '%',
  geographyType: 'brazil-state',
  sourceId: IBGE_POF_SOURCE_ID,
  direction: 'higher-worse',
}

const BRAZIL_STATE_MULTIDIMENSIONAL_VULNERABILITY_INDICATOR: Omit<Indicator, 'latestYear'> = {
  id: 'ibge-pof-multidimensional-vulnerability',
  name: 'Pessoas com vulnerabilidade multidimensional',
  themeId: 'poverty-inequality',
  description: 'Proporção de pessoas das famílias com algum grau de vulnerabilidade multidimensional não monetária, medida experimental da POF 2017-2018.',
  unit: '%',
  geographyType: 'brazil-state',
  sourceId: IBGE_POF_SOURCE_ID,
  direction: 'higher-worse',
}

const BRAZIL_STATE_VERY_LOW_INCOME_INDICATOR: Omit<Indicator, 'latestYear'> = {
  id: 'ibge-state-income-up-to-quarter-minimum-wage',
  name: 'Renda per capita até 1/4 do salário mínimo',
  themeId: 'poverty-inequality',
  description: 'Moradores em domicílios particulares permanentes ocupados com rendimento nominal mensal domiciliar per capita de até 1/4 do salário mínimo. Não é equivalente a uma linha internacional de pobreza extrema.',
  unit: '%',
  geographyType: 'brazil-state',
  sourceId: SIDRA_SOURCE_ID,
  direction: 'higher-worse',
}

const BRAZIL_STATE_FEMALE_LABOR_PARTICIPATION_INDICATOR: Omit<Indicator, 'latestYear'> = {
  id: 'ibge-state-female-labor-participation',
  name: 'Participação feminina na força de trabalho',
  themeId: 'gender-equality',
  description: 'Taxa média anual de participação das mulheres de 14 anos ou mais na força de trabalho, calculada pela média dos quatro trimestres disponíveis da PNAD Contínua.',
  unit: '%',
  geographyType: 'brazil-state',
  sourceId: SIDRA_SOURCE_ID,
  direction: 'higher-better',
}

const BRAZIL_STATE_LABOR_PARTICIPATION_GAP_INDICATOR: Omit<Indicator, 'latestYear'> = {
  id: 'ibge-state-labor-participation-gap',
  name: 'Diferença de participação na força de trabalho',
  themeId: 'gender-equality',
  description: 'Diferença entre as taxas médias anuais de participação masculina e feminina na força de trabalho, em pontos percentuais. Valores maiores indicam maior desigualdade.',
  unit: 'p.p.',
  geographyType: 'brazil-state',
  sourceId: SIDRA_SOURCE_ID,
  direction: 'higher-worse',
}

const BRAZIL_STATE_GENDER_WAGE_GAP_INDICATOR: Omit<Indicator, 'latestYear'> = {
  id: 'ibge-state-gender-wage-gap',
  name: 'Diferença salarial de gênero',
  themeId: 'gender-equality',
  description: 'Percentual pelo qual o rendimento médio mensal feminino de todos os trabalhos fica abaixo do masculino. Diferença bruta, sem ajuste por ocupação, jornada, escolaridade ou outros fatores.',
  unit: '%',
  geographyType: 'brazil-state',
  sourceId: SIDRA_SOURCE_ID,
  direction: 'higher-worse',
}

const BRAZIL_STATE_FIRE_HOTSPOTS_INDICATOR: Omit<Indicator, 'latestYear'> = {
  id: 'inpe-state-fire-hotspots',
  name: 'Focos ativos de fogo detectados',
  themeId: 'climate-vulnerability',
  description: 'Número anual de focos ativos detectados pelo satélite de referência do Programa Queimadas do INPE.',
  unit: 'focos',
  geographyType: 'brazil-state',
  sourceId: INPE_QUEIMADAS_SOURCE_ID,
  direction: 'higher-worse',
}

const BRAZIL_STATE_FIRE_HOTSPOTS_RATE_INDICATOR: Omit<Indicator, 'latestYear'> = {
  id: 'inpe-state-fire-hotspots-per-100k',
  name: 'Focos ativos de fogo por 100 mil habitantes',
  themeId: 'climate-vulnerability',
  description: 'Taxa anual de focos ativos detectados pelo satélite de referência do INPE, normalizada pela população residente estimada pelo IBGE.',
  unit: 'focos por 100 mil hab.',
  geographyType: 'brazil-state',
  sourceId: INPE_IBGE_FIRE_RATE_SOURCE_ID,
  direction: 'higher-worse',
}

const BRAZIL_STATE_RECENT_FIRE_HOTSPOTS_INDICATOR: Omit<Indicator, 'latestYear'> = {
  id: 'inpe-state-fire-hotspots-last-7-days',
  name: 'Focos ativos de fogo nos últimos 7 dias',
  themeId: 'climate-vulnerability',
  description: 'Detecções de focos ativos acumuladas nos sete arquivos diários mais recentes do Programa Queimadas do INPE.',
  unit: 'focos',
  geographyType: 'brazil-state',
  sourceId: INPE_QUEIMADAS_SOURCE_ID,
  direction: 'higher-worse',
}

const BRAZIL_STATE_ACTIVE_IMMIGRANTS_INDICATOR: Omit<Indicator, 'latestYear'> = {
  id: 'sismigra-state-active-immigrants',
  name: 'Registros ativos de imigrantes',
  themeId: 'forced-migration',
  description: 'Registros ativos de imigrantes no SISMIGRA por UF. Não representa todos os migrantes, refugiados ou deslocados forçados.',
  unit: 'pessoas',
  geographyType: 'brazil-state',
  sourceId: SISMIGRA_SOURCE_ID,
  direction: 'neutral',
}

const BRAZIL_STATE_UNPAID_CARE_GAP_INDICATOR: Omit<Indicator, 'latestYear'> = {
  id: 'ibge-state-unpaid-care-gap',
  name: 'Diferença de horas de cuidado não remunerado',
  themeId: 'gender-equality',
  description: 'Diferença entre mulheres e homens na média de horas dedicadas a afazeres domésticos e/ou cuidado de pessoas. Valores maiores indicam maior sobrecarga feminina.',
  unit: 'horas',
  geographyType: 'brazil-state',
  sourceId: SIDRA_SOURCE_ID,
  direction: 'higher-worse',
}

const BRAZIL_IMMEDIATE_WATER_INDICATOR: Omit<Indicator, 'latestYear'> = {
  id: 'ibge-water-network-coverage',
  name: 'Domicílios com rede geral de água',
  themeId: 'hunger-water',
  description: 'Percentual de domicílios ocupados com ligação à rede geral usada como forma principal de abastecimento.',
  unit: '%',
  geographyType: 'brazil-immediate-region',
  sourceId: SIDRA_SOURCE_ID,
  direction: 'higher-better',
}

const BRAZIL_IMMEDIATE_SANITATION_INDICATOR: Omit<Indicator, 'latestYear'> = {
  id: 'ibge-sanitation-network-coverage',
  name: 'Domicílios com esgotamento por rede',
  themeId: 'hunger-water',
  description: 'Percentual de domicílios ocupados com rede geral, rede pluvial ou fossa ligada à rede.',
  unit: '%',
  geographyType: 'brazil-immediate-region',
  sourceId: SIDRA_SOURCE_ID,
  direction: 'higher-better',
}

const BRAZIL_IMMEDIATE_WASTE_COLLECTION_INDICATOR: Omit<Indicator, 'latestYear'> = {
  id: 'ibge-waste-collection-coverage',
  name: 'Domicílios com lixo coletado',
  themeId: 'hunger-water',
  description: 'Percentual de domicílios ocupados com lixo coletado no domicílio ou depositado em caçamba de serviço de limpeza.',
  unit: '%',
  geographyType: 'brazil-immediate-region',
  sourceId: SIDRA_SOURCE_ID,
  direction: 'higher-better',
}

async function ensureDirs() {
  await mkdir(PUBLIC_DATA_DIR, { recursive: true })
  await mkdir(PUBLIC_SERIES_DIR, { recursive: true })
  await mkdir(path.join(PUBLIC_DATA_DIR, 'geo'), { recursive: true })
  await mkdir(RAW_DIR, { recursive: true })
}

async function fetchWithRetry(url: string, accept = '*/*') {
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response: Response
    try {
      response = await fetch(url, { headers: { Accept: accept, 'User-Agent': 'Mundialidade-open-source-dashboard/1.0' } })
    } catch (error) {
      lastError = error
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
      continue
    }

    if (response.ok) return response
    if (![403, 429, 500, 502, 503, 504].includes(response.status)) {
      throw new Error(`Fetch failed for ${url}: ${response.status}`)
    }
    lastError = new Error(`Fetch failed for ${url}: ${response.status}`)
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
  }
  throw lastError instanceof Error ? lastError : new Error(`Fetch failed for ${url}`)
}

async function fetchJson<T>(url: string): Promise<T> {
  return (await fetchWithRetry(url, 'application/json')).json() as Promise<T>
}

async function fetchText(url: string): Promise<string> {
  return (await fetchWithRetry(url)).text()
}

async function fetchBuffer(url: string): Promise<Buffer> {
  return Buffer.from(await (await fetchWithRetry(url)).arrayBuffer())
}

function parseCsv<T>(csv: string): T[] {
  const parsed = Papa.parse<T>(csv, { header: true, skipEmptyLines: true })
  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? 'CSV parse failed')
  }

  return parsed.data
}

function decodeXmlText(value: string) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
}

function readPofStatePercentageRows(workbookBuffer: Buffer) {
  const workbook = new AdmZip(workbookBuffer)
  const sharedStringsEntry = workbook.getEntry('xl/sharedStrings.xml')
  const sheetEntry = workbook.getEntry('xl/worksheets/sheet1.xml')
  if (!sharedStringsEntry || !sheetEntry) throw new Error('IBGE POF workbook structure is incomplete')

  const sharedStrings = Array.from(sharedStringsEntry.getData().toString('utf-8').matchAll(/<si>([\s\S]*?)<\/si>/g), (match) => decodeXmlText(match[1]))
  const rows: Array<{ name: string; value: number }> = []
  const sheetXml = sheetEntry.getData().toString('utf-8')

  // The official workbook uses a fixed table layout: state name in column A and poverty share in C.
  for (const rowMatch of sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = new Map<string, string>()
    for (const cellMatch of rowMatch[1].matchAll(/<c\s+([^>]*)>([\s\S]*?)<\/c>/g)) {
      const reference = cellMatch[1].match(/\br="([A-Z]+)\d+"/)?.[1]
      const type = cellMatch[1].match(/\bt="([^"]+)"/)?.[1]
      const rawValue = cellMatch[2].match(/<v>([\s\S]*?)<\/v>/)?.[1]
      const inlineValue = cellMatch[2].match(/<is>([\s\S]*?)<\/is>/)?.[1]
      if (!reference) continue
      if (type === 's' && rawValue !== undefined) cells.set(reference, sharedStrings[Number(rawValue)] ?? '')
      else if (inlineValue !== undefined) cells.set(reference, decodeXmlText(inlineValue))
      else if (rawValue !== undefined) cells.set(reference, decodeXmlText(rawValue))
    }

    const name = cells.get('A')?.trim()
    const value = toNumber(cells.get('C'))
    if (name && value !== null && name !== 'Brasil') rows.push({ name, value })
  }

  return rows
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function sortPoints(points: DataPoint[]) {
  return points.sort((a, b) => a.year - b.year)
}

async function loadWorldBankCountries() {
  const [, rows] = await fetchJson<
    [{ page: number; pages: number; per_page: string; total: number }, Array<{
      id: string
      iso2Code: string
      name: string
      region: { id: string; value: string }
    }>]
  >('https://api.worldbank.org/v2/country?format=json&per_page=400')

  return rows
    .filter((country) => country.region.value !== 'Aggregates')
    .map((country) => ({ code: country.id.toUpperCase(), name: country.name }))
}

async function loadWorldPopulation(validCountryIso3: Set<string>) {
  const [, rows] = await fetchJson<[{ lastupdated: string }, Array<{
    countryiso3code: string
    date: string
    value: number | null
  }>]>(
    'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=20000',
  )
  const worldPoints = rows
    .filter((row) => row.countryiso3code === 'WLD' && row.value !== null)
    .map((row) => ({ year: Number(row.date), value: row.value as number }))
    .filter((point) => Number.isFinite(point.year))
    .sort((a, b) => b.year - a.year)
  const latest = worldPoints[0]
  const previous = worldPoints[1]
  if (!latest || !previous) throw new Error('World population series is incomplete')
  const grouped = new Map<string, DataPoint[]>()
  for (const row of rows) {
    const code = row.countryiso3code?.toUpperCase()
    const year = Number(row.date)
    if (!validCountryIso3.has(code) || row.value === null || !Number.isFinite(year)) continue
    grouped.set(code, [...(grouped.get(code) ?? []), { year, value: row.value }])
  }
  const countryPopulation = Array.from(grouped, ([geographyCode, points]) => ({
    geographyCode,
    points: sortPoints(points),
  }))
  return {
    worldPopulation: { value: latest.value, referenceYear: latest.year, annualChange: latest.value - previous.value, sourceId: WORLD_BANK_SOURCE_ID },
    countryPopulation,
  }
}

async function loadWorldBankIndicator(
  config: WorldBankIndicatorConfig,
  validCountryIso3: Set<string>,
) {
  const [meta, rows] = await fetchJson<
    [{ lastupdated: string }, Array<{
      country: { value: string }
      countryiso3code: string
      date: string
      value: number | null
    }>]
  >(
    `https://api.worldbank.org/v2/country/all/indicator/${config.wbCode}?format=json&per_page=20000`,
  )

  const grouped = new Map<string, Series>()

  for (const row of rows) {
    const iso3 = row.countryiso3code?.toUpperCase()
    if (!validCountryIso3.has(iso3) || row.value === null) {
      continue
    }

    const year = Number(row.date)
    if (!Number.isFinite(year)) {
      continue
    }

    const current = grouped.get(iso3) ?? {
      indicatorId: config.id,
      geographyType: 'country' as const,
      geographyCode: iso3,
      geographyName: row.country.value,
      points: [],
    }

    current.points.push({ year, value: row.value })
    grouped.set(iso3, current)
  }

  const series = Array.from(grouped.values()).map((entry) => ({
    ...entry,
    points: sortPoints(entry.points),
  }))

  return {
    indicator: {
      ...config,
      latestYear: Math.max(...series.flatMap((entry) => entry.points.map((point) => point.year))),
    } satisfies Indicator,
    source: {
      id: WORLD_BANK_SOURCE_ID,
      name: 'World Bank Open Data',
      url: 'https://data.worldbank.org/',
      methodologyUrl:
        'https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation',
      license: 'CC BY 4.0',
      lastUpdated: meta.lastupdated,
    } satisfies Source,
    series,
  }
}

async function loadWorldBankGapIndicator(
  config: WorldBankGapIndicatorConfig,
  validCountryIso3: Set<string>,
) {
  type WorldBankRow = {
    country: { value: string }
    countryiso3code: string
    date: string
    value: number | null
  }
  const [femaleResponse, maleResponse] = await Promise.all([
    fetchJson<[{ lastupdated: string }, WorldBankRow[]]>(`https://api.worldbank.org/v2/country/all/indicator/${config.femaleCode}?format=json&per_page=20000`),
    fetchJson<[{ lastupdated: string }, WorldBankRow[]]>(`https://api.worldbank.org/v2/country/all/indicator/${config.maleCode}?format=json&per_page=20000`),
  ])
  const maleValues = new Map(
    maleResponse[1].filter((row) => row.value !== null).map((row) => [
      `${row.countryiso3code.toUpperCase()}-${row.date}`,
      row.value as number,
    ]),
  )
  const grouped = new Map<string, Series>()

  femaleResponse[1].forEach((row) => {
    const code = row.countryiso3code?.toUpperCase()
    const year = Number(row.date)
    const maleValue = maleValues.get(`${code}-${row.date}`)
    if (!validCountryIso3.has(code) || row.value === null || maleValue === undefined || !Number.isFinite(year)) return

    const current = grouped.get(code) ?? {
      indicatorId: config.id,
      geographyType: 'country' as const,
      geographyCode: code,
      geographyName: row.country.value,
      points: [],
    }
    current.points.push({ year, value: maleValue - row.value })
    grouped.set(code, current)
  })

  const series = Array.from(grouped.values()).map((entry) => ({ ...entry, points: sortPoints(entry.points) }))
  return {
    indicator: {
      ...config,
      latestYear: Math.max(...series.flatMap((entry) => entry.points.map((point) => point.year))),
    } satisfies Indicator,
    source: {
      id: WORLD_BANK_SOURCE_ID,
      name: 'World Bank Open Data',
      url: 'https://data.worldbank.org/',
      methodologyUrl: 'https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation',
      license: 'CC BY 4.0',
      lastUpdated: femaleResponse[0].lastupdated,
    } satisfies Source,
    series,
  }
}

type UnhcrPopulationRow = {
  year: number
  coo_iso: string
  coo_name: string
  coa_iso: string
  coa_name: string
  refugees: string | number
  asylum_seekers: string | number
  idps: string | number
}

type UnhcrPopulationResponse = { items: UnhcrPopulationRow[] }

async function loadUnhcrIndicators(validCountryIso3: Set<string>) {
  const [originResponse, asylumResponse] = await Promise.all([
    fetchJson<UnhcrPopulationResponse>('https://api.unhcr.org/population/v1/population/?limit=10000&yearFrom=2000&yearTo=2025&coo_all=true&cf_type=ISO'),
    fetchJson<UnhcrPopulationResponse>('https://api.unhcr.org/population/v1/population/?limit=10000&yearFrom=2000&yearTo=2025&coa_all=true&cf_type=ISO'),
  ])

  const results = UNHCR_INDICATORS.map((config) => {
    const rows = config.perspective === 'origin' ? originResponse.items : asylumResponse.items
    const grouped = new Map<string, Series>()

    rows.forEach((row) => {
      const code = (config.perspective === 'origin' ? row.coo_iso : row.coa_iso)?.toUpperCase()
      const name = config.perspective === 'origin' ? row.coo_name : row.coa_name
      const value = toNumber(row[config.field])
      if (!validCountryIso3.has(code) || !name || !Number.isFinite(row.year) || value === null) return

      const current = grouped.get(code) ?? {
        indicatorId: config.id,
        geographyType: 'country' as const,
        geographyCode: code,
        geographyName: name,
        points: [],
      }
      current.points.push({ year: row.year, value })
      grouped.set(code, current)
    })

    const series = Array.from(grouped.values()).map((entry) => ({ ...entry, points: sortPoints(entry.points) }))
    return {
      indicator: {
        ...config,
        latestYear: Math.max(...series.flatMap((entry) => entry.points.map((point) => point.year))),
      } satisfies Indicator,
      series,
    }
  })

  return {
    results,
    source: {
      id: UNHCR_SOURCE_ID,
      name: 'UNHCR Refugee Data Finder',
      url: 'https://www.unhcr.org/refugee-statistics',
      methodologyUrl: 'https://www.unhcr.org/refugee-statistics/methodology',
      license: 'CC BY 4.0',
      lastUpdated: '2026-06-11',
    } satisfies Source,
  }
}

async function loadNdGain(countriesByIso3: Map<string, string>) {
  const zipBuffer = await fetchBuffer('https://gain.nd.edu/assets/647440/ndgain_countryindex_2026.zip')
  await writeFile(path.join(RAW_DIR, 'ndgain_countryindex_2026.zip'), zipBuffer)

  const zip = new AdmZip(zipBuffer)
  const datasetDefinitions = [
    {
      id: 'nd-gain-index',
      entryName: 'resources 2/gain/gain.csv',
      name: 'ND-GAIN',
      description: 'Índice composto de vulnerabilidade climática e prontidão para adaptação.',
      direction: 'higher-better' as const,
    },
    {
      id: 'nd-gain-vulnerability',
      entryName: 'resources 2/vulnerability/vulnerability.csv',
      name: 'Vulnerabilidade climática',
      description: 'Exposição, sensibilidade e capacidade adaptativa frente aos impactos climáticos. Menor pontuação é melhor.',
      direction: 'higher-worse' as const,
    },
    {
      id: 'nd-gain-readiness',
      entryName: 'resources 2/readiness/readiness.csv',
      name: 'Prontidão para adaptação',
      description: 'Capacidade econômica, de governança e social para transformar investimentos em ações de adaptação.',
      direction: 'higher-better' as const,
    },
    {
      id: 'nd-gain-food-vulnerability',
      entryName: 'resources 2/vulnerability/food.csv',
      name: 'Risco climático: alimentação',
      description: 'Vulnerabilidade dos sistemas alimentares aos impactos das mudanças climáticas. Maior pontuação indica maior risco.',
      direction: 'higher-worse' as const,
    },
    {
      id: 'nd-gain-water-vulnerability',
      entryName: 'resources 2/vulnerability/water.csv',
      name: 'Risco climático: água',
      description: 'Vulnerabilidade do setor de água aos impactos das mudanças climáticas. Maior pontuação indica maior risco.',
      direction: 'higher-worse' as const,
    },
    {
      id: 'nd-gain-health-vulnerability',
      entryName: 'resources 2/vulnerability/health.csv',
      name: 'Risco climático: saúde',
      description: 'Vulnerabilidade da saúde humana aos impactos das mudanças climáticas. Maior pontuação indica maior risco.',
      direction: 'higher-worse' as const,
    },
    {
      id: 'nd-gain-governance-readiness',
      entryName: 'resources 2/readiness/governance.csv',
      name: 'Prontidão: governança',
      description: 'Capacidade de governança para apoiar investimentos e respostas de adaptação climática.',
      direction: 'higher-better' as const,
    },
  ]

  const results = datasetDefinitions.map((definition) => {
    const entry = zip.getEntries().find((candidate) => candidate.entryName.endsWith(definition.entryName))
    if (!entry) {
      throw new Error(`ND-GAIN ${definition.entryName} not found`)
    }

    const series: Series[] = []
    const rows = parseCsv<Record<string, string>>(entry.getData().toString('utf-8'))
    for (const row of rows) {
      const iso3 = row.ISO3?.toUpperCase()
      if (!iso3 || !countriesByIso3.has(iso3)) {
        continue
      }

      const points = Object.entries(row)
        .filter(([key]) => /^\d{4}$/.test(key))
        .map(([year, value]) => ({ year: Number(year), value: toNumber(value) }))
        .filter((point): point is DataPoint => point.value !== null)

      if (points.length > 0) {
        series.push({
          indicatorId: definition.id,
          geographyType: 'country',
          geographyCode: iso3,
          geographyName: countriesByIso3.get(iso3) ?? row.Name,
          points: sortPoints(points),
        })
      }
    }

    return {
      indicator: {
        id: definition.id,
        name: definition.name,
        themeId: 'climate-vulnerability',
        description: definition.description,
        unit: 'score',
        geographyType: 'country',
        sourceId: ND_GAIN_SOURCE_ID,
        direction: definition.direction,
        latestYear: 2024,
      } satisfies Indicator,
      series,
    }
  })

  return {
    source: {
      id: ND_GAIN_SOURCE_ID,
      name: 'Notre Dame Global Adaptation Initiative',
      url: 'https://gain.nd.edu/our-work/country-index/',
      methodologyUrl: 'https://gain.nd.edu/our-work/country-index/methodology/',
      license: 'Creative Commons open license',
      lastUpdated: '2026-07-15',
    } satisfies Source,
    results,
  }
}

async function loadBrazilStateIndicator() {
  const response = await fetchJson<Array<{
    resultados: Array<{ series: Array<{ localidade: { id: string; nome: string }; serie: Record<string, string> }> }>
  }>>(`https://servicodados.ibge.gov.br/api/v3/agregados/${BRAZIL_STATE_INDICATOR.sidraTable}/periodos/all/variaveis/${BRAZIL_STATE_INDICATOR.sidraVariable}?localidades=N3%5Ball%5D`)

  const grouped = new Map<string, Series>()
  response[0]?.resultados[0]?.series.forEach((entry) => {
    const current = { indicatorId: BRAZIL_STATE_INDICATOR.id, geographyType: 'brazil-state' as const, geographyCode: entry.localidade.id, geographyName: entry.localidade.nome, points: Object.entries(entry.serie).flatMap(([year, value]) => { const parsed = toNumber(value); return parsed === null ? [] : [{ year: Number(year), value: parsed }] }) }
    grouped.set(current.geographyCode, current)
  })

  return {
    indicator: {
      ...BRAZIL_STATE_INDICATOR,
      latestYear: Math.max(...Array.from(grouped.values()).flatMap((entry) => entry.points.map((point) => point.year))),
    } satisfies Indicator,
    source: {
      id: SIDRA_SOURCE_ID,
      name: 'IBGE SIDRA',
      url: 'https://sidra.ibge.gov.br/',
      methodologyUrl: 'https://servicodados.ibge.gov.br/api/docs/agregados',
      license: 'Dados públicos do IBGE',
      lastUpdated: 'Dados públicos do IBGE',
    } satisfies Source,
    series: Array.from(grouped.values()).map((entry) => ({
      ...entry,
      points: sortPoints(entry.points),
    })),
  }
}

async function loadBrazilStateGiniIndicator() {
  const response = await fetchJson<IbgeAggregateResponse>('https://servicodados.ibge.gov.br/api/v3/agregados/10301/periodos/all/variaveis/13418?localidades=N3%5Ball%5D')
  const series = response[0]?.resultados[0]?.series.flatMap((entry) => {
    const points = Object.entries(entry.serie).flatMap(([year, value]) => { const parsed = toNumber(value); return parsed === null ? [] : [{ year: Number(year), value: parsed }] })
    return points.length ? [{ indicatorId: BRAZIL_STATE_GINI_INDICATOR.id, geographyType: 'brazil-state' as const, geographyCode: entry.localidade.id, geographyName: entry.localidade.nome, points }] : []
  }) ?? []
  return { indicator: { ...BRAZIL_STATE_GINI_INDICATOR, latestYear: Math.max(...series.flatMap((entry) => entry.points.map((point) => point.year))) } satisfies Indicator, series }
}

async function loadBrazilStateIncomeIndicator() {
  const response = await fetchJson<IbgeAggregateResponse>('https://servicodados.ibge.gov.br/api/v3/agregados/7395/periodos/all/variaveis/4196?localidades=N3%5Ball%5D')
  const grouped = new Map<string, Series>()
  response[0]?.resultados[0]?.series.forEach((entry) => {
    const current = { indicatorId: BRAZIL_STATE_INCOME_INDICATOR.id, geographyType: 'brazil-state' as const, geographyCode: entry.localidade.id, geographyName: entry.localidade.nome, points: Object.entries(entry.serie).flatMap(([year, value]) => { const parsed = toNumber(value); return parsed === null ? [] : [{ year: Number(year), value: parsed }] }) }
    grouped.set(current.geographyCode, current)
  })
  const series = Array.from(grouped.values()).map((entry) => ({ ...entry, points: sortPoints(entry.points) }))
  return { indicator: { ...BRAZIL_STATE_INCOME_INDICATOR, latestYear: Math.max(...series.flatMap((entry) => entry.points.map((point) => point.year))) } satisfies Indicator, series }
}

async function loadBrazilStateVeryLowIncomeIndicator() {
  const response = await fetchJson<IbgeAggregateResponse>('https://servicodados.ibge.gov.br/api/v3/agregados/10296/periodos/2022/variaveis/1013604?localidades=N3%5Ball%5D&classificacao=2%5B6794%5D%7C86%5B95251%5D%7C386%5B9681%5D')
  const series = response[0]?.resultados[0]?.series.flatMap((entry) => {
    const points = Object.entries(entry.serie).flatMap(([year, value]) => { const parsed = toNumber(value); return parsed === null ? [] : [{ year: Number(year), value: parsed }] })
    return points.length ? [{ indicatorId: BRAZIL_STATE_VERY_LOW_INCOME_INDICATOR.id, geographyType: 'brazil-state' as const, geographyCode: entry.localidade.id, geographyName: entry.localidade.nome, points }] : []
  }) ?? []
  if (series.length !== 27) throw new Error(`IBGE Censo expected 27 states, received ${series.length}`)
  return { indicator: { ...BRAZIL_STATE_VERY_LOW_INCOME_INDICATOR, latestYear: 2022 } satisfies Indicator, series }
}

type IbgeGenderLaborResponse = Array<{
  resultados: Array<{
    classificacoes: Array<{ categoria: Record<string, string> }>
    series: Array<{ localidade: { id: string; nome: string }; serie: Record<string, string> }>
  }>
}>

function calculateAnnualAverage(points: Record<string, string>) {
  const valuesByYear = new Map<number, number[]>()
  Object.entries(points).forEach(([period, rawValue]) => {
    const year = Number(period.slice(0, 4))
    const value = toNumber(rawValue)
    if (Number.isFinite(year) && value !== null) valuesByYear.set(year, [...(valuesByYear.get(year) ?? []), value])
  })
  return Array.from(valuesByYear.entries())
    .filter(([, values]) => values.length === 4)
    .map(([year, values]) => ({ year, value: values.reduce((total, current) => total + current, 0) / values.length }))
}

async function loadBrazilStateGenderLaborIndicators() {
  const response = await fetchJson<IbgeGenderLaborResponse>('https://servicodados.ibge.gov.br/api/v3/agregados/4093/periodos/all/variaveis/4096?localidades=N3%5Ball%5D&classificacao=2%5B4%2C5%5D')
  const results = response[0]?.resultados ?? []
  const maleResult = results.find((result) => Object.keys(result.classificacoes[0]?.categoria ?? {}).includes('4'))
  const femaleResult = results.find((result) => Object.keys(result.classificacoes[0]?.categoria ?? {}).includes('5'))
  if (!maleResult || !femaleResult) throw new Error('IBGE PNAD gender labor categories not found')

  const maleByState = new Map(maleResult.series.map((entry) => [entry.localidade.id, calculateAnnualAverage(entry.serie)]))
  const femaleSeries = femaleResult.series.flatMap((entry) => {
    const points = calculateAnnualAverage(entry.serie)
    return points.length ? [{ indicatorId: BRAZIL_STATE_FEMALE_LABOR_PARTICIPATION_INDICATOR.id, geographyType: 'brazil-state' as const, geographyCode: entry.localidade.id, geographyName: entry.localidade.nome, points }] : []
  })
  const gapSeries = femaleResult.series.flatMap((entry) => {
    const maleByYear = new Map((maleByState.get(entry.localidade.id) ?? []).map((point) => [point.year, point.value]))
    const points = calculateAnnualAverage(entry.serie).flatMap((point) => {
      const maleValue = maleByYear.get(point.year)
      return maleValue === undefined ? [] : [{ year: point.year, value: maleValue - point.value }]
    })
    return points.length ? [{ indicatorId: BRAZIL_STATE_LABOR_PARTICIPATION_GAP_INDICATOR.id, geographyType: 'brazil-state' as const, geographyCode: entry.localidade.id, geographyName: entry.localidade.nome, points }] : []
  })
  if (femaleSeries.length !== 27 || gapSeries.length !== 27) throw new Error('IBGE PNAD expected 27 state gender labor series')

  const latestYear = Math.max(...femaleSeries.flatMap((entry) => entry.points.map((point) => point.year)))
  return {
    results: [
      { indicator: { ...BRAZIL_STATE_FEMALE_LABOR_PARTICIPATION_INDICATOR, latestYear } satisfies Indicator, series: femaleSeries },
      { indicator: { ...BRAZIL_STATE_LABOR_PARTICIPATION_GAP_INDICATOR, latestYear } satisfies Indicator, series: gapSeries },
    ],
  }
}

async function loadBrazilStateGenderWageGapIndicator() {
  const response = await fetchJson<IbgeGenderLaborResponse>('https://servicodados.ibge.gov.br/api/v3/agregados/10280/periodos/2022/variaveis/13536?localidades=N3%5Ball%5D&classificacao=2%5B4%2C5%5D%7C11913%5B96165%5D')
  const results = response[0]?.resultados ?? []
  const maleResult = results.find((result) => Object.keys(result.classificacoes[0]?.categoria ?? {}).includes('4'))
  const femaleResult = results.find((result) => Object.keys(result.classificacoes[0]?.categoria ?? {}).includes('5'))
  if (!maleResult || !femaleResult) throw new Error('IBGE Censo gender wage categories not found')

  const maleIncomeByState = new Map(maleResult.series.flatMap((entry) => {
    const value = toNumber(entry.serie['2022'])
    return value === null ? [] : [[entry.localidade.id, value] as const]
  }))
  const series = femaleResult.series.flatMap((entry) => {
    const femaleIncome = toNumber(entry.serie['2022'])
    const maleIncome = maleIncomeByState.get(entry.localidade.id)
    if (femaleIncome === null || maleIncome === undefined || maleIncome <= 0) return []
    return [{
      indicatorId: BRAZIL_STATE_GENDER_WAGE_GAP_INDICATOR.id,
      geographyType: 'brazil-state' as const,
      geographyCode: entry.localidade.id,
      geographyName: entry.localidade.nome,
      points: [{ year: 2022, value: ((maleIncome - femaleIncome) / maleIncome) * 100 }],
    }]
  })
  if (series.length !== 27) throw new Error(`IBGE Censo expected 27 state wage gaps, received ${series.length}`)
  return { indicator: { ...BRAZIL_STATE_GENDER_WAGE_GAP_INDICATOR, latestYear: 2022 } satisfies Indicator, series }
}

async function loadBrazilStateUnpaidCareGapIndicator() {
  const response = await fetchJson<IbgeGenderLaborResponse>('https://servicodados.ibge.gov.br/api/v3/agregados/7013/periodos/all/variaveis/10192?localidades=N3%5Ball%5D&classificacao=2%5B4%2C5%5D%7C12085%5B100543%5D')
  const results = response[0]?.resultados ?? []
  const maleResult = results.find((result) => Object.keys(result.classificacoes[0]?.categoria ?? {}).includes('4'))
  const femaleResult = results.find((result) => Object.keys(result.classificacoes[0]?.categoria ?? {}).includes('5'))
  if (!maleResult || !femaleResult) throw new Error('IBGE PNAD unpaid care categories not found')

  const maleHoursByState = new Map(maleResult.series.map((entry) => [
    entry.localidade.id,
    new Map(Object.entries(entry.serie).flatMap(([year, value]) => {
      const parsed = toNumber(value)
      return parsed === null ? [] : [[Number(year), parsed] as const]
    })),
  ]))
  const series = femaleResult.series.flatMap((entry) => {
    const maleHoursByYear = maleHoursByState.get(entry.localidade.id)
    const points = Object.entries(entry.serie).flatMap(([year, value]) => {
      const femaleHours = toNumber(value)
      const maleHours = maleHoursByYear?.get(Number(year))
      return femaleHours === null || maleHours === undefined ? [] : [{ year: Number(year), value: femaleHours - maleHours }]
    })
    return points.length ? [{ indicatorId: BRAZIL_STATE_UNPAID_CARE_GAP_INDICATOR.id, geographyType: 'brazil-state' as const, geographyCode: entry.localidade.id, geographyName: entry.localidade.nome, points: sortPoints(points) }] : []
  })
  if (series.length !== 27) throw new Error(`IBGE PNAD expected 27 state unpaid care gaps, received ${series.length}`)
  return {
    indicator: { ...BRAZIL_STATE_UNPAID_CARE_GAP_INDICATOR, latestYear: Math.max(...series.flatMap((entry) => entry.points.map((point) => point.year))) } satisfies Indicator,
    series,
  }
}

function latestFireHotspotYear(directoryListing: string) {
  const years = Array.from(directoryListing.matchAll(/focos_br_sp_ref_(\d{4})\.zip/g), (match) => Number(match[1]))
  const latestYear = Math.max(...years)
  if (!Number.isFinite(latestYear)) throw new Error('INPE fire hotspot archive year not found')
  return latestYear
}

async function loadBrazilStateActiveImmigrantsIndicator() {
  const baseUrl = 'https://servicos.dpf.gov.br/dadosabertos/SISMIGRA/REGISTROS_ATIVOS/2026'
  const listing = await fetchText(`${baseUrl}/`)
  const files = Array.from(listing.matchAll(/SISMIGRA_REGISTROS_ATIVOS_(\d{4})_(\d{2})\.csv/g), (match) => match[0]).sort()
  const latestFile = files.at(-1)
  if (!latestFile) throw new Error('SISMIGRA active records file not found')
  const [, year, month] = latestFile.match(/_(\d{4})_(\d{2})\.csv$/) ?? []
  const rows = parseCsv<{ UF: string; QTD: string }>(await fetchText(`${baseUrl}/${latestFile}`))
  const totals = new Map<string, number>()
  for (const row of rows) {
    const code = BRAZIL_STATE_CODE_BY_POSTAL[row.UF?.trim()]
    const quantity = Number(row.QTD)
    if (code && Number.isFinite(quantity)) totals.set(code, (totals.get(code) ?? 0) + quantity)
  }
  const states = await fetchJson<Array<{ id: number; nome: string }>>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
  const series = states.map((state) => ({
    indicatorId: BRAZIL_STATE_ACTIVE_IMMIGRANTS_INDICATOR.id,
    geographyType: 'brazil-state' as const,
    geographyCode: String(state.id),
    geographyName: state.nome,
    points: [{ year: Number(year), value: totals.get(String(state.id)) ?? 0 }],
  }))
  return {
    indicator: { ...BRAZIL_STATE_ACTIVE_IMMIGRANTS_INDICATOR, latestYear: Number(year) } satisfies Indicator,
    series,
    source: { id: SISMIGRA_SOURCE_ID, name: 'Polícia Federal SISMIGRA', url: `${baseUrl}/${latestFile}`, methodologyUrl: 'https://www.gov.br/mj/pt-br/assuntos/seus-direitos/migracoes/portal-de-imigracao-laboral/obmigra-1/microdados/sismigra/SISMIGRA', license: 'Dados abertos da Polícia Federal', lastUpdated: `${year}-${month}` } satisfies Source,
  }
}

function countFireHotspots(zipBuffer: Buffer) {
  const archive = new AdmZip(zipBuffer)
  const csv = archive.getEntries().find((entry) => entry.entryName.endsWith('.csv'))
  if (!csv) throw new Error('INPE fire hotspot CSV not found in archive')
  const rows = csv.getData().toString('utf-8').trim().split(/\r?\n/)
  return Math.max(rows.length - 1, 0)
}

async function loadBrazilStateFireHotspotsIndicator() {
  const baseUrl = 'https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/anual/EstadosBr_sat_ref'
  const latestYear = latestFireHotspotYear(await fetchText(`${baseUrl}/SP/`))
  const [states, populationResponse] = await Promise.all([
    fetchJson<Array<{ id: number; nome: string }>>('https://servicodados.ibge.gov.br/api/v1/localidades/estados'),
    fetchJson<IbgeAggregateResponse>(`https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/${latestYear}/variaveis/9324?localidades=N3%5Ball%5D`),
  ])
  const stateNameByCode = new Map(states.map((state) => [String(state.id), state.nome]))
  const populationByState = new Map(
    populationResponse.flatMap((response) => response.resultados)
      .flatMap((result) => result.series)
      .map((entry) => [entry.localidade.id, Number(entry.serie[String(latestYear)])] as const),
  )
  const postalCodes = Object.keys(BRAZIL_STATE_CODE_BY_POSTAL)
  const series: Series[] = []

  for (let start = 0; start < postalCodes.length; start += 4) {
    const batch = postalCodes.slice(start, start + 4)
    const entries = await Promise.all(batch.map(async (postalCode) => {
      const code = BRAZIL_STATE_CODE_BY_POSTAL[postalCode]
      const fileName = `focos_br_${postalCode.toLowerCase()}_ref_${latestYear}.zip`
      const total = countFireHotspots(await fetchBuffer(`${baseUrl}/${postalCode}/${fileName}`))
      return {
        indicatorId: BRAZIL_STATE_FIRE_HOTSPOTS_INDICATOR.id,
        geographyType: 'brazil-state' as const,
        geographyCode: code,
        geographyName: stateNameByCode.get(code) ?? postalCode,
        points: [{ year: latestYear, value: total }],
      }
    }))
    series.push(...entries)
  }

  if (series.length !== 27) throw new Error(`INPE expected 27 state fire hotspot series, received ${series.length}`)
  const rateSeries = series.map((entry) => {
    const population = populationByState.get(entry.geographyCode)
    if (!population || !Number.isFinite(population)) {
      throw new Error(`IBGE population estimate missing for state ${entry.geographyCode} in ${latestYear}`)
    }
    return {
      ...entry,
      indicatorId: BRAZIL_STATE_FIRE_HOTSPOTS_RATE_INDICATOR.id,
      points: entry.points.map((point) => ({
        ...point,
        value: (point.value / population) * 100_000,
      })),
    }
  })

  return {
    results: [
      {
        indicator: { ...BRAZIL_STATE_FIRE_HOTSPOTS_INDICATOR, latestYear } satisfies Indicator,
        series,
      },
      {
        indicator: { ...BRAZIL_STATE_FIRE_HOTSPOTS_RATE_INDICATOR, latestYear } satisfies Indicator,
        series: rateSeries,
      },
    ],
    source: {
      id: INPE_QUEIMADAS_SOURCE_ID,
      name: 'INPE Programa Queimadas',
      url: 'https://www.terrabrasilis.dpi.inpe.br/queimadas/portal/pages/secao_downloads/dados-abertos/index.html',
      methodologyUrl: 'https://www.terrabrasilis.dpi.inpe.br/queimadas/portal/pages/secao_informacoes/faq/',
      license: 'Dados abertos para uso público',
      lastUpdated: String(latestYear),
    } satisfies Source,
    rateSource: {
      id: INPE_IBGE_FIRE_RATE_SOURCE_ID,
      name: 'INPE Programa Queimadas + IBGE Estimativas da População',
      url: 'https://www.terrabrasilis.dpi.inpe.br/queimadas/portal/pages/secao_downloads/dados-abertos/index.html',
      methodologyUrl: 'https://servicodados.ibge.gov.br/api/docs/agregados',
      license: 'Dados abertos para uso público e dados públicos do IBGE',
      lastUpdated: String(latestYear),
    } satisfies Source,
  }
}

function latestDailyFireHotspotFiles(directoryListing: string) {
  const files = Array.from(new Set(
    Array.from(directoryListing.matchAll(/focos_diario_br_(\d{8})\.csv/g), (match) => match[0]),
  )).sort().slice(-7)
  if (files.length < 7) throw new Error(`INPE expected seven daily fire hotspot files, received ${files.length}`)
  return files
}

async function loadBrazilStateRecentFireHotspotsIndicator() {
  const baseUrl = 'https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/diario/Brasil'
  const files = latestDailyFireHotspotFiles(await fetchText(`${baseUrl}/`))
  const states = await fetchJson<Array<{ id: number; nome: string }>>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
  const stateNameByCode = new Map(states.map((state) => [String(state.id), state.nome]))
  const counts = new Map(states.map((state) => [String(state.id), 0]))
  const dailyRows = await Promise.all(files.map((fileName) => fetchText(`${baseUrl}/${fileName}`)))

  for (const content of dailyRows) {
    for (const row of parseCsv<Record<string, string>>(content)) {
      const stateCode = row.estado_id?.trim()
      if (stateCode && counts.has(stateCode)) counts.set(stateCode, (counts.get(stateCode) ?? 0) + 1)
    }
  }

  const latestDate = files.at(-1)?.match(/(\d{4})(\d{2})(\d{2})/)?.slice(1).join('-')
  if (!latestDate) throw new Error('INPE latest daily fire hotspot date not found')
  const latestYear = Number(latestDate.slice(0, 4))
  const series = Array.from(counts, ([geographyCode, value]) => ({
    indicatorId: BRAZIL_STATE_RECENT_FIRE_HOTSPOTS_INDICATOR.id,
    geographyType: 'brazil-state' as const,
    geographyCode,
    geographyName: stateNameByCode.get(geographyCode) ?? geographyCode,
    points: [{ year: latestYear, value }],
  }))

  return {
    indicator: { ...BRAZIL_STATE_RECENT_FIRE_HOTSPOTS_INDICATOR, latestYear } satisfies Indicator,
    source: {
      id: INPE_QUEIMADAS_SOURCE_ID,
      name: 'INPE Programa Queimadas',
      url: 'https://www.terrabrasilis.dpi.inpe.br/queimadas/portal/pages/secao_downloads/dados-abertos/index.html',
      methodologyUrl: 'https://www.terrabrasilis.dpi.inpe.br/queimadas/portal/pages/secao_informacoes/faq/',
      license: 'Dados abertos para uso público',
      lastUpdated: latestDate,
    } satisfies Source,
    series,
  }
}

async function loadBrazilStatePofIndicator(indicator: Omit<Indicator, 'latestYear'>, tableFileName: string) {
  const [pofZipBuffer, states] = await Promise.all([
    fetchBuffer('https://ftp.ibge.gov.br/Orcamentos_Familiares/Evolucao_dos_Indicadores_nao_Monetarios_de_Pobreza_e_Qualidade_de_Vida_no_Brasil/tabelas_2017_2018_xls.zip'),
    fetchJson<Array<{ id: number; nome: string }>>('https://servicodados.ibge.gov.br/api/v1/localidades/estados'),
  ])
  const pofZip = new AdmZip(pofZipBuffer)
  const tableEntry = pofZip.getEntries().find((entry) => entry.entryName === tableFileName)
  if (!tableEntry) throw new Error(`IBGE POF ${tableFileName} not found`)

  const stateCodeByName = new Map(states.map((state) => [state.nome, String(state.id)]))
  const series = readPofStatePercentageRows(tableEntry.getData()).flatMap(({ name, value }) => {
    const code = stateCodeByName.get(name)
    return code ? [{
      indicatorId: indicator.id,
      geographyType: 'brazil-state' as const,
      geographyCode: code,
      geographyName: name,
      points: [{ year: 2018, value }],
    }] : []
  })
  if (series.length !== 27) throw new Error(`IBGE POF expected 27 states, received ${series.length}`)

  return {
    indicator: { ...indicator, latestYear: 2018 } satisfies Indicator,
    source: {
      id: IBGE_POF_SOURCE_ID,
      name: 'IBGE Pesquisa de Orçamentos Familiares',
      url: 'https://www.ibge.gov.br/estatisticas/sociais/educacao/24786-pof-2017-2018.html',
      methodologyUrl: 'https://ftp.ibge.gov.br/Orcamentos_Familiares/Evolucao_dos_Indicadores_nao_Monetarios_de_Pobreza_e_Qualidade_de_Vida_no_Brasil/indice_de_tabelas.pdf',
      license: 'Dados públicos do IBGE',
      lastUpdated: '2017-2018',
    } satisfies Source,
    series,
  }
}

type IbgeAggregateResponse = Array<{
  resultados: Array<{
    series: Array<{ localidade: { id: string; nome: string }; serie: Record<string, string> }>
  }>
}>

async function loadBrazilImmediateRegionCoverage(
  indicator: Omit<Indicator, 'latestYear'>,
  table: string,
  classification: string,
) {
  const [municipalities, totalResponse, networkResponse] = await Promise.all([
    fetchJson<Array<{
      id: number
      'regiao-imediata': { id: number; nome: string; 'regiao-intermediaria': { UF: { id: number } } }
    }>>('https://servicodados.ibge.gov.br/api/v1/localidades/municipios'),
    fetchJson<IbgeAggregateResponse>(`https://servicodados.ibge.gov.br/api/v3/agregados/${table}/periodos/2022/variaveis/381?localidades=N6%5Ball%5D`),
    fetchJson<IbgeAggregateResponse>(`https://servicodados.ibge.gov.br/api/v3/agregados/${table}/periodos/2022/variaveis/381?localidades=N6%5Ball%5D&classificacao=${classification}`),
  ])

  const regionsByMunicipality = new Map(municipalities.map((municipality) => [
    String(municipality.id),
    {
      code: String(municipality['regiao-imediata'].id),
      name: municipality['regiao-imediata'].nome,
      stateCode: String(municipality['regiao-imediata']['regiao-intermediaria'].UF.id),
    },
  ]))
  const totalByMunicipality = new Map(totalResponse[0]?.resultados[0]?.series.map((entry) => [
    entry.localidade.id,
    Number(entry.serie['2022']),
  ]))
  const networkByMunicipality = new Map(networkResponse[0]?.resultados[0]?.series.map((entry) => [
    entry.localidade.id,
    Number(entry.serie['2022']),
  ]))
  const grouped = new Map<string, { name: string; stateCode: string; total: number; network: number }>()

  for (const [municipalityCode, total] of totalByMunicipality) {
    const region = regionsByMunicipality.get(municipalityCode)
    const network = networkByMunicipality.get(municipalityCode)
    if (!region || !Number.isFinite(total) || network === undefined || !Number.isFinite(network)) continue
    const current = grouped.get(region.code) ?? { ...region, total: 0, network: 0 }
    current.total += total
    current.network += network
    grouped.set(region.code, current)
  }

  const series = Array.from(grouped.entries()).map(([code, region]) => ({
    indicatorId: indicator.id,
    geographyType: 'brazil-immediate-region' as const,
    geographyCode: code,
    geographyName: region.name,
    points: [{ year: 2022, value: (region.network / region.total) * 100 }],
  }))
  return { indicator: { ...indicator, latestYear: 2022 } satisfies Indicator, series, regions: Array.from(grouped.entries()).map(([code, region]) => ({ code, name: region.name, stateCode: region.stateCode })) }
}

function buildLatest(series: Series[]) {
  return series
    .map((entry) => {
      const point = entry.points.at(-1)
      return point
        ? {
            indicatorId: entry.indicatorId,
            geographyType: entry.geographyType,
            geographyCode: entry.geographyCode,
            geographyName: entry.geographyName,
            year: point.year,
            value: point.value,
          }
        : null
    })
    .filter((entry): entry is LatestValue => entry !== null)
}

async function loadCachedIndicator(indicatorId: string) {
  const dashboard = JSON.parse(await readFile(path.join(PUBLIC_DATA_DIR, 'mundialidade.json'), 'utf-8')) as DashboardData
  const indicator = dashboard.indicators.find((entry) => entry.id === indicatorId)
  if (!indicator) throw new Error(`Cached indicator ${indicatorId} is unavailable`)
  const series = JSON.parse(await readFile(path.join(PUBLIC_SERIES_DIR, `${indicatorId}.json`), 'utf-8')) as Series[]
  const source = dashboard.sources.find((entry) => entry.id === indicator.sourceId)
  if (!source) throw new Error(`Cached source for ${indicatorId} is unavailable`)
  return { indicator, series, source }
}

function buildRankings(indicators: Indicator[], latest: LatestValue[]): Ranking[] {
  return indicators.map((indicator) => ({
    indicatorId: indicator.id,
    geographyType: indicator.geographyType,
    year: indicator.latestYear,
    items: latest
      .filter((entry) => entry.indicatorId === indicator.id)
      .sort((a, b) => b.value - a.value)
      .slice(0, 20),
  }))
}

async function writeGeoJsonFiles() {
  const worldGeoJson = await fetchText(
    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson',
  )
  const admin1GeoJson = await fetchText(
    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson',
  )

  const admin1 = JSON.parse(admin1GeoJson) as {
    type: 'FeatureCollection'
    features: Array<{ properties: Record<string, string> }>
  }
  const world = JSON.parse(worldGeoJson) as {
    features: Array<{ properties: Record<string, string> }>
  }

  const brazilStates = {
    type: 'FeatureCollection',
    features: admin1.features.filter((feature) => {
      const props = feature.properties
      return (
        props.adm0_a3 === 'BRA' ||
        props.iso_a2 === 'BR' ||
        props.geonunit === 'Brazil' ||
        props.admin === 'Brazil'
      )
    }).map((feature) => {
      const postal = feature.properties.postal
      return {
        ...feature,
        properties: {
          ...feature.properties,
          sidra_code: postal ? BRAZIL_STATE_CODE_BY_POSTAL[postal] : undefined,
        },
      }
    }),
  }

  await writeFile(path.join(PUBLIC_DATA_DIR, 'geo', 'world.geojson'), JSON.stringify(world))
  await writeFile(
    path.join(PUBLIC_DATA_DIR, 'geo', 'brazil-states.geojson'),
    JSON.stringify(brazilStates),
  )

  return new Map(world.features.map((feature) => [
    feature.properties.ADM0_A3 ?? feature.properties.ISO_A3,
    feature.properties.CONTINENT ?? 'Sem classificação',
  ]))
}

async function main() {
  await ensureDirs()

  const countries = (await loadWorldBankCountries()).sort((a, b) => a.name.localeCompare(b.name))
  const countriesByIso3 = new Map(countries.map((country) => [country.code, country.name]))
  const validCountryIso3 = new Set(countries.map((country) => country.code))

  const [worldBankResults, worldBankGapResults, populationData] = await Promise.all([
    Promise.all(WORLD_BANK_INDICATORS.map((indicator) => loadWorldBankIndicator(indicator, validCountryIso3))),
    Promise.all(WORLD_BANK_GAP_INDICATORS.map((indicator) => loadWorldBankGapIndicator(indicator, validCountryIso3))),
    loadWorldPopulation(validCountryIso3),
  ])
  const [ndGain, unhcr] = await Promise.all([
    loadNdGain(countriesByIso3),
    loadUnhcrIndicators(validCountryIso3),
  ])
  const fireHotspotsPromise = withCachedFallback(loadBrazilStateFireHotspotsIndicator, async () => {
    const [annual, rate] = await Promise.all([
      loadCachedIndicator(BRAZIL_STATE_FIRE_HOTSPOTS_INDICATOR.id),
      loadCachedIndicator(BRAZIL_STATE_FIRE_HOTSPOTS_RATE_INDICATOR.id),
    ])
    return { results: [annual, rate], source: annual.source, rateSource: rate.source }
  }, console.warn, 'INPE annual fire')
  const recentFireHotspotsPromise = withCachedFallback(loadBrazilStateRecentFireHotspotsIndicator, () => loadCachedIndicator(BRAZIL_STATE_RECENT_FIRE_HOTSPOTS_INDICATOR.id), console.warn, 'INPE recent fire')
  const [brazilStates, brazilStateGini, brazilStateIncome, brazilStateVeryLowIncome, brazilStateGenderLabor, brazilStateGenderWageGap, brazilStateUnpaidCareGap, brazilStateFireHotspots, brazilStateRecentFireHotspots, brazilStateActiveImmigrants, brazilStateMultidimensionalPoverty, brazilStateMultidimensionalVulnerability, immediateRegions, immediateSanitation, immediateWasteCollection] = await Promise.all([
    loadBrazilStateIndicator(),
    loadBrazilStateGiniIndicator(),
    loadBrazilStateIncomeIndicator(),
    loadBrazilStateVeryLowIncomeIndicator(),
    loadBrazilStateGenderLaborIndicators(),
    loadBrazilStateGenderWageGapIndicator(),
    loadBrazilStateUnpaidCareGapIndicator(),
    fireHotspotsPromise,
    recentFireHotspotsPromise,
    loadBrazilStateActiveImmigrantsIndicator(),
    loadBrazilStatePofIndicator(BRAZIL_STATE_MULTIDIMENSIONAL_POVERTY_INDICATOR, 'Tabela 6b.xlsx'),
    loadBrazilStatePofIndicator(BRAZIL_STATE_MULTIDIMENSIONAL_VULNERABILITY_INDICATOR, 'Tabela 5b.xlsx'),
    loadBrazilImmediateRegionCoverage(BRAZIL_IMMEDIATE_WATER_INDICATOR, '6803', '1821%5B72144%5D'),
    loadBrazilImmediateRegionCoverage(BRAZIL_IMMEDIATE_SANITATION_INDICATOR, '6805', '11558%5B46290%5D'),
    loadBrazilImmediateRegionCoverage(BRAZIL_IMMEDIATE_WASTE_COLLECTION_INDICATOR, '6892', '67%5B2520%5D'),
  ])

  const continentByIso3 = await writeGeoJsonFiles()
  const countriesWithContinent = countries.map((country) => ({
    ...country,
    continent: continentByIso3.get(country.code) ?? 'Sem classificação',
  }))

  const indicators = [
    ...worldBankResults.map((result) => result.indicator),
    ...worldBankGapResults.map((result) => result.indicator),
    ...unhcr.results.map((result) => result.indicator),
    ...ndGain.results.map((result) => result.indicator),
    brazilStates.indicator,
    brazilStateGini.indicator,
    brazilStateIncome.indicator,
    brazilStateVeryLowIncome.indicator,
    ...brazilStateGenderLabor.results.map((result) => result.indicator),
    brazilStateGenderWageGap.indicator,
    brazilStateUnpaidCareGap.indicator,
    ...brazilStateFireHotspots.results.map((result) => result.indicator),
    brazilStateRecentFireHotspots.indicator,
    brazilStateActiveImmigrants.indicator,
    brazilStateMultidimensionalPoverty.indicator,
    brazilStateMultidimensionalVulnerability.indicator,
    immediateRegions.indicator,
    immediateSanitation.indicator,
    immediateWasteCollection.indicator,
  ]
  const series = [
    ...worldBankResults.flatMap((result) => result.series),
    ...worldBankGapResults.flatMap((result) => result.series),
    ...unhcr.results.flatMap((result) => result.series),
    ...ndGain.results.flatMap((result) => result.series),
    ...brazilStates.series,
    ...brazilStateGini.series,
    ...brazilStateIncome.series,
    ...brazilStateVeryLowIncome.series,
    ...brazilStateGenderLabor.results.flatMap((result) => result.series),
    ...brazilStateGenderWageGap.series,
    ...brazilStateUnpaidCareGap.series,
    ...brazilStateFireHotspots.results.flatMap((result) => result.series),
    ...brazilStateRecentFireHotspots.series,
    ...brazilStateActiveImmigrants.series,
    ...brazilStateMultidimensionalPoverty.series,
    ...brazilStateMultidimensionalVulnerability.series,
    ...immediateRegions.series,
    ...immediateSanitation.series,
    ...immediateWasteCollection.series,
  ]
  const latest = buildLatest(series)
  const rankings = buildRankings(indicators, latest)

  const sources = new Map<string, Source>()
  for (const source of [...worldBankResults.map((result) => result.source), ...worldBankGapResults.map((result) => result.source), unhcr.source, ndGain.source, brazilStates.source, brazilStateFireHotspots.source, brazilStateFireHotspots.rateSource, brazilStateRecentFireHotspots.source, brazilStateActiveImmigrants.source, brazilStateMultidimensionalPoverty.source]) {
    sources.set(source.id, source)
  }
  sources.set(NATURAL_EARTH_SOURCE_ID, {
    id: NATURAL_EARTH_SOURCE_ID,
    name: 'Natural Earth',
    url: 'https://www.naturalearthdata.com/',
    methodologyUrl: 'https://www.naturalearthdata.com/about/terms-of-use/',
    license: 'Public domain',
    lastUpdated: 'Domínio público',
  })

  const data: DashboardData = {
    generatedAt: new Date().toISOString(),
    themes: THEMES,
    indicators,
    sources: Array.from(sources.values()),
    countries: countriesWithContinent,
    continents: Array.from(new Set(countriesWithContinent.map((country) => country.continent)))
      .filter((continent) => continent !== 'Sem classificação')
      .sort((a, b) => a.localeCompare(b, 'pt-BR')),
    brazilStates: brazilStates.series
      .map((entry) => ({ code: entry.geographyCode, name: entry.geographyName }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    brazilImmediateRegions: immediateRegions.regions.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    series,
    latest,
    rankings,
    countryPopulation: populationData.countryPopulation,
    worldPopulation: populationData.worldPopulation,
    notes: [
      'O MVP combina séries globais comparáveis por país com um primeiro recorte estadual do Brasil.',
      'O indicador estadual atual mede pessoas em domicílios com beneficiário do Bolsa Família, como proxy de vulnerabilidade social e pobreza.',
      'A renda per capita de até 1/4 do salário mínimo usa o Censo 2022 e é um indicador de baixa renda, não uma linha internacional de pobreza extrema.',
      'As séries estaduais de participação na força de trabalho por sexo usam médias dos quatro trimestres disponíveis em cada ano da PNAD Contínua.',
      'A diferença salarial de gênero estadual compara rendimentos médios de homens e mulheres no Censo 2022 e não controla diferenças de ocupação, jornada ou escolaridade.',
      'A diferença de cuidado não remunerado compara horas médias de mulheres e homens na PNAD Contínua anual; os anos sem divulgação não são interpolados.',
      'Os focos ativos de fogo do INPE são detecções de satélite e não equivalem, isoladamente, ao número de incêndios ou à área queimada.',
      'A taxa anual de focos por 100 mil habitantes divide as detecções do INPE pela estimativa populacional do IBGE no mesmo ano; ela é mais adequada para comparar UFs com populações diferentes.',
      'O indicador de sete dias soma todos os registros presentes nos arquivos diários do INPE e serve para leitura recente, não para comparação com o total anual do satélite de referência.',
      'A pobreza multidimensional estadual é uma estatística experimental da POF 2017-2018; ela combina privações não monetárias e não deve ser interpretada como série anual.',
      'O recorte de Regiões Geográficas Imediatas usa o Censo 2022 do IBGE e agrega municípios pela divisão territorial vigente.',
      'A arquitetura em conectores permite plugar novas tabelas do IBGE e novas fontes internacionais sem redesenhar o frontend.',
    ],
  }

  await Promise.all(indicators.map((indicator) => writeFile(
    path.join(PUBLIC_SERIES_DIR, `${indicator.id}.json`),
    JSON.stringify(series.filter((entry) => entry.indicatorId === indicator.id)),
  )))
  await writeFile(path.join(PUBLIC_SERIES_DIR, 'country-population.json'), JSON.stringify(populationData.countryPopulation))

  const initialData = {
    ...data,
    series: [],
    countryPopulation: [],
  }

  const outputPath = path.join(PUBLIC_DATA_DIR, 'mundialidade.json')
  const previous = await readFile(outputPath, 'utf-8').then((content) => JSON.parse(content) as DashboardData).catch(() => null)
  if (previous) {
    const previousComparable = { ...previous, generatedAt: '' }
    const nextComparable = { ...initialData, generatedAt: '' }
    if (JSON.stringify(previousComparable) === JSON.stringify(nextComparable)) initialData.generatedAt = previous.generatedAt
  }

  await writeFile(
    outputPath,
    JSON.stringify(initialData),
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
