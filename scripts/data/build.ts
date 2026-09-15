import AdmZip from 'adm-zip'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import Papa from 'papaparse'

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
  direction: 'higher-better' | 'higher-worse'
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
  notes: string[]
}

type WorldBankIndicatorConfig = Omit<Indicator, 'latestYear'> & {
  wbCode: string
}

const ROOT = process.cwd()
const PUBLIC_DATA_DIR = path.join(ROOT, 'public', 'data')
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
const SIDRA_SOURCE_ID = 'ibge-sidra'
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
  {
    id: 'wb-refugees-origin',
    wbCode: 'SM.POP.RHCR.EO',
    name: 'Refugiados por país de origem',
    themeId: 'forced-migration',
    description: 'Total de refugiados por país de origem.',
    unit: 'pessoas',
    geographyType: 'country',
    sourceId: WORLD_BANK_SOURCE_ID,
    direction: 'higher-worse',
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

async function ensureDirs() {
  await mkdir(PUBLIC_DATA_DIR, { recursive: true })
  await mkdir(path.join(PUBLIC_DATA_DIR, 'geo'), { recursive: true })
  await mkdir(RAW_DIR, { recursive: true })
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status}`)
  }

  return response.json() as Promise<T>
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status}`)
  }

  return response.text()
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

function parseCsv<T>(csv: string): T[] {
  const parsed = Papa.parse<T>(csv, { header: true, skipEmptyLines: true })
  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? 'CSV parse failed')
  }

  return parsed.data
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

async function loadNdGain(countriesByIso3: Map<string, string>) {
  const zipBuffer = await fetchBuffer('https://gain.nd.edu/assets/647440/ndgain_countryindex_2026.zip')
  await writeFile(path.join(RAW_DIR, 'ndgain_countryindex_2026.zip'), zipBuffer)

  const zip = new AdmZip(zipBuffer)
  const gainEntry = zip
    .getEntries()
    .find((entry) => entry.entryName.endsWith('resources 2/gain/gain.csv'))

  if (!gainEntry) {
    throw new Error('ND-GAIN gain.csv not found')
  }

  const rows = parseCsv<Record<string, string>>(gainEntry.getData().toString('utf-8'))
  const series: Series[] = []

  for (const row of rows) {
    const iso3 = row.ISO3?.toUpperCase()
    if (!iso3 || !countriesByIso3.has(iso3)) {
      continue
    }

    const points = Object.entries(row)
      .filter(([key]) => /^\d{4}$/.test(key))
      .map(([year, value]) => ({ year: Number(year), value: toNumber(value) }))
      .filter((point): point is DataPoint => point.value !== null)

    if (points.length === 0) {
      continue
    }

    series.push({
      indicatorId: 'nd-gain-index',
      geographyType: 'country',
      geographyCode: iso3,
      geographyName: countriesByIso3.get(iso3) ?? row.Name,
      points: sortPoints(points),
    })
  }

  return {
    indicator: {
      id: 'nd-gain-index',
      name: 'ND-GAIN',
      themeId: 'climate-vulnerability',
      description: 'Índice composto de vulnerabilidade climática e prontidão para adaptação.',
      unit: 'score',
      geographyType: 'country',
      sourceId: ND_GAIN_SOURCE_ID,
      direction: 'higher-better',
      latestYear: 2024,
    } satisfies Indicator,
    source: {
      id: ND_GAIN_SOURCE_ID,
      name: 'Notre Dame Global Adaptation Initiative',
      url: 'https://gain.nd.edu/our-work/country-index/',
      methodologyUrl: 'https://gain.nd.edu/our-work/country-index/methodology/',
      license: 'Creative Commons open license',
      lastUpdated: '2026-07-15',
    } satisfies Source,
    series,
  }
}

async function loadBrazilStateIndicator() {
  const rows = await fetchJson<Array<Record<string, string>>>(
    `https://apisidra.ibge.gov.br/values/t/${BRAZIL_STATE_INDICATOR.sidraTable}/n3/all/v/${BRAZIL_STATE_INDICATOR.sidraVariable}/p/all?formato=json`,
  )

  const grouped = new Map<string, Series>()
  for (const row of rows.slice(1)) {
    const code = row.D1C
    const name = row.D1N
    const year = Number(row.D3C)
    const value = toNumber(row.V)

    if (!code || !name || !Number.isFinite(year) || value === null) {
      continue
    }

    const current = grouped.get(code) ?? {
      indicatorId: BRAZIL_STATE_INDICATOR.id,
      geographyType: 'brazil-state' as const,
      geographyCode: code,
      geographyName: name,
      points: [],
    }

    current.points.push({ year, value })
    grouped.set(code, current)
  }

  return {
    indicator: {
      ...BRAZIL_STATE_INDICATOR,
      latestYear: 2025,
    } satisfies Indicator,
    source: {
      id: SIDRA_SOURCE_ID,
      name: 'IBGE SIDRA',
      url: 'https://sidra.ibge.gov.br/',
      methodologyUrl: 'https://servicodados.ibge.gov.br/api/docs/agregados',
      license: 'Dados públicos do IBGE',
      lastUpdated: '2026-05-08',
    } satisfies Source,
    series: Array.from(grouped.values()).map((entry) => ({
      ...entry,
      points: sortPoints(entry.points),
    })),
  }
}

type IbgeAggregateResponse = Array<{
  resultados: Array<{
    series: Array<{ localidade: { id: string; nome: string }; serie: Record<string, string> }>
  }>
}>

async function loadBrazilImmediateRegionWaterIndicator() {
  const [municipalities, totalResponse, networkResponse] = await Promise.all([
    fetchJson<Array<{
      id: number
      'regiao-imediata': { id: number; nome: string; 'regiao-intermediaria': { UF: { id: number } } }
    }>>('https://servicodados.ibge.gov.br/api/v1/localidades/municipios'),
    fetchJson<IbgeAggregateResponse>('https://servicodados.ibge.gov.br/api/v3/agregados/6803/periodos/2022/variaveis/381?localidades=N6%5Ball%5D'),
    fetchJson<IbgeAggregateResponse>('https://servicodados.ibge.gov.br/api/v3/agregados/6803/periodos/2022/variaveis/381?localidades=N6%5Ball%5D&classificacao=1821%5B72144%5D'),
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
    indicatorId: BRAZIL_IMMEDIATE_WATER_INDICATOR.id,
    geographyType: 'brazil-immediate-region' as const,
    geographyCode: code,
    geographyName: region.name,
    points: [{ year: 2022, value: (region.network / region.total) * 100 }],
  }))
  return { indicator: { ...BRAZIL_IMMEDIATE_WATER_INDICATOR, latestYear: 2022 } satisfies Indicator, series, regions: Array.from(grouped.entries()).map(([code, region]) => ({ code, name: region.name, stateCode: region.stateCode })) }
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

  await writeFile(path.join(PUBLIC_DATA_DIR, 'geo', 'world.geojson'), worldGeoJson)
  await writeFile(
    path.join(PUBLIC_DATA_DIR, 'geo', 'brazil-states.geojson'),
    JSON.stringify(brazilStates, null, 2),
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

  const worldBankResults = await Promise.all(
    WORLD_BANK_INDICATORS.map((indicator) =>
      loadWorldBankIndicator(indicator, validCountryIso3),
    ),
  )
  const ndGain = await loadNdGain(countriesByIso3)
  const [brazilStates, immediateRegions] = await Promise.all([
    loadBrazilStateIndicator(),
    loadBrazilImmediateRegionWaterIndicator(),
  ])

  const continentByIso3 = await writeGeoJsonFiles()
  const countriesWithContinent = countries.map((country) => ({
    ...country,
    continent: continentByIso3.get(country.code) ?? 'Sem classificação',
  }))

  const indicators = [
    ...worldBankResults.map((result) => result.indicator),
    ndGain.indicator,
    brazilStates.indicator,
    immediateRegions.indicator,
  ]
  const series = [
    ...worldBankResults.flatMap((result) => result.series),
    ...ndGain.series,
    ...brazilStates.series,
    ...immediateRegions.series,
  ]
  const latest = buildLatest(series)
  const rankings = buildRankings(indicators, latest)

  const sources = new Map<string, Source>()
  for (const source of [...worldBankResults.map((result) => result.source), ndGain.source, brazilStates.source]) {
    sources.set(source.id, source)
  }
  sources.set(NATURAL_EARTH_SOURCE_ID, {
    id: NATURAL_EARTH_SOURCE_ID,
    name: 'Natural Earth',
    url: 'https://www.naturalearthdata.com/',
    methodologyUrl: 'https://www.naturalearthdata.com/about/terms-of-use/',
    license: 'Public domain',
    lastUpdated: new Date().toISOString().slice(0, 10),
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
    notes: [
      'O MVP combina séries globais comparáveis por país com um primeiro recorte estadual do Brasil.',
      'O indicador estadual atual mede pessoas em domicílios com beneficiário do Bolsa Família, como proxy de vulnerabilidade social e pobreza.',
      'O recorte de Regiões Geográficas Imediatas usa o Censo 2022 do IBGE e agrega municípios pela divisão territorial vigente.',
      'A arquitetura em conectores permite plugar novas tabelas do IBGE e novas fontes internacionais sem redesenhar o frontend.',
    ],
  }

  await writeFile(
    path.join(PUBLIC_DATA_DIR, 'mundialidade.json'),
    JSON.stringify(data, null, 2),
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
