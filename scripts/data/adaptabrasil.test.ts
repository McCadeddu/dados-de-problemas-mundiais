import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { normalizeAdaptaRows, validateAdaptaHierarchy, type AdaptaHierarchyItem, type RawAdaptaRow, type StateCrosswalk } from './adaptabrasil.js'
import { adaptaCsv, parseAdaptaData, type AdaptaData } from '../../src/lib/adaptabrasil.js'
import Papa from 'papaparse'

const rawFile = readFileSync('public/data/adaptabrasil-source.json')
const raw = JSON.parse(rawFile.toString()) as { metadata: AdaptaHierarchyItem[]; crosswalk: StateCrosswalk; responses: Array<{ year: number; scenario: number | null; rows: RawAdaptaRow[] }> }
const data = JSON.parse(readFileSync('public/data/adaptabrasil.json', 'utf8')) as AdaptaData
const legend = validateAdaptaHierarchy(raw.metadata).legend

describe('official AdaptaBrasil snapshots', () => {
  it('reproduces each published scenario from its original response and checks the source hash', () => {
    expect(parseAdaptaData(data).snapshots).toHaveLength(5)
    expect(createHash('sha256').update(rawFile).digest('hex')).toBe(data.sourceSha256)
    for (const snapshot of data.snapshots) {
      const response = raw.responses.find(r => r.year === snapshot.year && r.scenario === snapshot.scenarioId)!
      expect(normalizeAdaptaRows(response.rows, snapshot.year, snapshot.scenarioId, raw.crosswalk, legend)).toEqual(snapshot.states)
      expect(snapshot.period).not.toBe('')
    }
  })
  it('validates UF identity by official abbreviation and name and retains a divergent source code', () => {
    const rows = structuredClone(raw.responses[0].rows)
    const sp = rows.find(r => r.state === 'SP')!
    sp.geocod_ibge = '34'
    const result = normalizeAdaptaRows(rows, 2020, null, raw.crosswalk, legend).find(s => s.abbreviation === 'SP')!
    expect(result.code).toBe('35')
    expect(result.sourceCode).toBe('34')
    sp.name = 'Rio de Janeiro'
    expect(() => normalizeAdaptaRows(rows, 2020, null, raw.crosswalk, legend)).toThrow('Território')
  })
  it('keeps zero distinct from missing, and rejects partial, duplicate or crossed-scenario responses', () => {
    const rows = structuredClone(raw.responses[0].rows)
    rows[0].value = 0; rows[0].valuecolor = legend[0].color; rows[0].rangelabel = legend[0].label
    rows[1].value = null
    const normalized = normalizeAdaptaRows(rows, 2020, null, raw.crosswalk, legend)
    expect(normalized.find(s => s.abbreviation === rows[0].state)?.value).toBe(0)
    expect(normalized.find(s => s.abbreviation === rows[1].state)?.value).toBeNull()
    expect(() => normalizeAdaptaRows(rows.slice(1), 2020, null, raw.crosswalk, legend)).toThrow('incompleta')
    expect(() => normalizeAdaptaRows([rows[0], ...rows.slice(0, 26)], 2020, null, raw.crosswalk, legend)).toThrow('inesperado')
    expect(() => normalizeAdaptaRows(rows, 2030, 49, raw.crosswalk, legend)).toThrow('cenário')
    rows[0].value = 1.01
    expect(() => normalizeAdaptaRows(rows, 2020, null, raw.crosswalk, legend)).toThrow('escala')
  })
  it('exports the selected horizon and scenario with both geographic codes and missing cells blank', () => {
    const snapshot = structuredClone(data.snapshots.find(s => s.year === 2050 && s.scenarioId === 50)!)
    snapshot.states[0].value = null; snapshot.states[1].value = 0
    const csv = Papa.parse<Record<string, string>>(adaptaCsv(data, snapshot), { header: true, skipEmptyLines: true })
    expect(csv.data).toHaveLength(27)
    expect(csv.data[0].valor_indice_0_a_1).toBe('')
    expect(csv.data[1].valor_indice_0_a_1).toBe('0')
    expect(csv.data.every(r => r.referencia_horizonte === '2050' && r.cenario_id === '50')).toBe(true)
    expect(csv.data.find(r => r.sigla_uf === 'SP')?.codigo_ibge).toBe('35')
  })
  it('rejects changed definitions, legends and incompatible published scenario bundles', () => {
    const changed = structuredClone(raw.metadata)
    changed.find(i => i.id === 2)!.legend!.items[0].maxvalue = .2
    expect(() => validateAdaptaHierarchy(changed)).toThrow('Escala')
    const crossed = structuredClone(data); crossed.snapshots[0].scenarioId = 49
    expect(() => parseAdaptaData(crossed)).toThrow('cenário')
  })
})
