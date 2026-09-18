export type JsonStat = {
  id: string[]
  size: number[]
  updated: string
  dimension: Record<string, { category: { index: Record<string, number> } }>
  value: Record<string, number | null> | Array<number | null>
  status?: Record<string, string>
}

// EU and EFTA only: Eurostat's reuse policy has exceptions for other countries.
export const EUROSTAT_COUNTRIES: Record<string, string> = {
  BE: 'BEL', BG: 'BGR', CZ: 'CZE', DK: 'DNK', DE: 'DEU', EE: 'EST', IE: 'IRL',
  EL: 'GRC', ES: 'ESP', FR: 'FRA', HR: 'HRV', IT: 'ITA', CY: 'CYP', LV: 'LVA',
  LT: 'LTU', LU: 'LUX', HU: 'HUN', MT: 'MLT', NL: 'NLD', AT: 'AUT', PL: 'POL',
  PT: 'PRT', RO: 'ROU', SI: 'SVN', SK: 'SVK', FI: 'FIN', SE: 'SWE',
  IS: 'ISL', NO: 'NOR', CH: 'CHE', LI: 'LIE',
}
export const POVERTY_FILTERS = { freq: 'A', statinfo: 'MED_EI', unit: 'PC', rskpovth: 'B_60', sex: 'T', age: 'TOTAL' }
export const POVERTY_URL = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/ilc_li02?'
  + new URLSearchParams({ lang: 'EN', ...POVERTY_FILTERS, sinceTimePeriod: '2015' })

export function parsePoverty(data: JsonStat) {
  const expected = [...Object.keys(POVERTY_FILTERS), 'geo', 'time']
  if (!data.updated || !data.value || data.id.length !== expected.length || data.size.length !== data.id.length
    || new Set(data.id).size !== expected.length || expected.some((id) => !data.id.includes(id))) {
    throw new Error('Estrutura Eurostat inesperada')
  }
  for (const [id, code] of Object.entries(POVERTY_FILTERS)) {
    const index = data.dimension[id]?.category.index
    if (!index || Object.keys(index).length !== 1 || index[code] !== 0 || data.size[data.id.indexOf(id)] !== 1) {
      throw new Error(`Filtro Eurostat não confirmado: ${id}`)
    }
  }
  const geoAxis = data.id.indexOf('geo')
  const timeAxis = data.id.indexOf('time')
  const strides = data.size.map((_, i) => data.size.slice(i + 1).reduce((a, b) => a * b, 1))
  const times = Object.entries(data.dimension.time.category.index)
  return Object.entries(data.dimension.geo.category.index).flatMap(([geo, geoIndex]) => {
    const countryCode = EUROSTAT_COUNTRIES[geo]
    if (!countryCode) return []
    const points = times.flatMap(([time, timeIndex]) => {
      const key = geoIndex * strides[geoAxis] + timeIndex * strides[timeAxis]
      const value = Array.isArray(data.value) ? data.value[key] : data.value[String(key)]
      const status = data.status?.[key]
      if (value === null || value === undefined) return []
      if (!/^\d{4}$/.test(time) || !Number.isFinite(value) || value < 0 || value > 100) {
        throw new Error(`Observação Eurostat inválida: ${geo}/${time}`)
      }
      return [{ year: Number(time), value, ...(status ? { status } : {}) }]
    }).sort((a, b) => a.year - b.year)
    return points.length ? [{ countryCode, points }] : []
  })
}
