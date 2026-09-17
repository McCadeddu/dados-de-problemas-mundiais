import type { ThemeId } from '../types'

export const THEME_ROUTE_BY_ID: Record<ThemeId, string> = {
  'hunger-water': 'fome-e-sede',
  'gender-equality': 'genero',
  'poverty-inequality': 'pobreza',
  'climate-vulnerability': 'clima',
  'forced-migration': 'migracao',
}

export function getThemeIdFromPath(pathname: string): ThemeId | undefined {
  const route = pathname.split('/').filter(Boolean).at(-1)
  return (Object.entries(THEME_ROUTE_BY_ID) as Array<[ThemeId, string]>).find(([, value]) => value === route)?.[0]
}

export function getThemePath(themeId: ThemeId) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${basePath}/${THEME_ROUTE_BY_ID[themeId]}/`
}
