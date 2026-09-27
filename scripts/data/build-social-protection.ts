import { readFile, writeFile } from 'node:fs/promises'
import type { NationalData } from '../../src/types.js'
import { loadStatsSaPension, pensionCsv, PENSION_INDICATOR_ID } from './statssa-pension.js'

const pension = await loadStatsSaPension()
const national = JSON.parse(await readFile('public/data/national-data.json', 'utf8')) as NationalData
const coverage = JSON.parse(await readFile('public/data/country-coverage.json', 'utf8')) as {
  generatedAt: string; countries: Array<{ countryCode: string; supplementalIndicators: string[] }>
}
const country = coverage.countries.find((entry) => entry.countryCode === 'ZAF')
if (!country) throw new Error('África do Sul ausente no diagnóstico de cobertura')
country.supplementalIndicators = [...new Set([...country.supplementalIndicators, PENSION_INDICATOR_ID])]
const generatedAt = new Date().toISOString()
await writeFile('public/data/south-africa-pension.csv', pensionCsv(pension))
await writeFile('public/data/national-data.json', JSON.stringify({ ...national, generatedAt, southAfricaPension: pension }))
await writeFile('public/data/country-coverage.json', JSON.stringify({ ...coverage, generatedAt }))
console.log('Stats SA: proteção previdenciária patronal, 2019–2024, total e por sexo; edição LMD 2024 revisada.')
