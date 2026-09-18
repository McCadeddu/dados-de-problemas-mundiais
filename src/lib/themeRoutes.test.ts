import { describe, expect, it } from 'vitest'
import { getThemeIdFromPath } from './themeRoutes'

describe('theme routes', () => {
  it('recognizes a thematic page below the GitHub Pages project path', () => {
    expect(getThemeIdFromPath('/dados-de-problemas-mundiais/clima/')).toBe('climate-vulnerability')
  })
  it('opens education and work in their own thematic routes', () => {
    expect(getThemeIdFromPath('/dados-de-problemas-mundiais/analfabetismo/')).toBe('illiteracy')
    expect(getThemeIdFromPath('/dados-de-problemas-mundiais/trabalho/')).toBe('decent-work')
  })
})
