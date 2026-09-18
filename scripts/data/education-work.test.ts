import { describe, expect, it } from 'vitest'
import { percentage, parseIbgeSeries } from './education-work.js'

describe('education and work indicators', () => {
  it('derives illiteracy without converting missing data or suppressed values to zero', () => {
    expect(percentage(96.4, true)).toBe(3.6)
    expect(percentage(100, true)).toBe(0)
    for (const missing of [null, undefined, '', '-', '..', '...', 'X', false, -1, 101]) {
      expect(percentage(missing, true)).toBeNull()
    }
  })
  it('uses only fourth quarters and never labels partial 2026 data as an annual observation', () => {
    const rows = [{ localidade: { id: '35', nome: 'São Paulo' }, serie: { '202501': '30', '202504': '28.5', '202602': '27', '202404': '-' } }]
    expect(parseIbgeSeries(rows, 'no-pension', true)[0].points).toEqual([{ year: 2025, value: 28.5 }])
  })
  it('retains gaps in annual education statistics', () => {
    const rows = [{ localidade: { id: '35', nome: 'São Paulo' }, serie: { '2019': '3.1', '2020': '...', '2022': '2.8' } }]
    expect(parseIbgeSeries(rows, 'illiteracy', false)[0].points).toEqual([{ year: 2019, value: 3.1 }, { year: 2022, value: 2.8 }])
  })
})
