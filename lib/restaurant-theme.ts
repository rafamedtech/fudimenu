export const restaurantThemePrimaryOptions = [
  'black',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose'
] as const

export const restaurantThemeNeutralOptions = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'taupe',
  'mauve',
  'mist',
  'olive'
] as const

export const restaurantThemeRadiusOptions = ['0', '0.125', '0.25', '0.375', '0.5'] as const

export const restaurantThemeColorModeOptions = ['light', 'dark', 'system'] as const
export const restaurantThemeFontOptions = ['public-sans', 'plus-jakarta-sans', 'system-sans'] as const
export const restaurantThemeIconOptions = ['lucide', 'heroicons'] as const

export type RestaurantThemePrimary = (typeof restaurantThemePrimaryOptions)[number]
export type RestaurantThemeNeutral = (typeof restaurantThemeNeutralOptions)[number]
export type RestaurantThemeRadius = (typeof restaurantThemeRadiusOptions)[number]
export type RestaurantThemeColorMode = (typeof restaurantThemeColorModeOptions)[number]
export type RestaurantThemeFont = (typeof restaurantThemeFontOptions)[number]
export type RestaurantThemeIcons = (typeof restaurantThemeIconOptions)[number]

export interface RestaurantThemeConfig {
  primary: RestaurantThemePrimary
  neutral: RestaurantThemeNeutral
  radius: RestaurantThemeRadius
  font: RestaurantThemeFont
  icons: RestaurantThemeIcons
  colorMode: RestaurantThemeColorMode
}

export const defaultRestaurantThemeConfig: RestaurantThemeConfig = {
  primary: 'sky',
  neutral: 'stone',
  radius: '0.375',
  font: 'public-sans',
  icons: 'lucide',
  colorMode: 'light'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function includesOption<T extends string>(options: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (options as readonly string[]).includes(value)
}

export function resolveRestaurantThemeConfig(value: unknown): RestaurantThemeConfig {
  const source = isRecord(value) ? value : {}

  return {
    primary: includesOption(restaurantThemePrimaryOptions, source.primary)
      ? source.primary
      : defaultRestaurantThemeConfig.primary,
    neutral: includesOption(restaurantThemeNeutralOptions, source.neutral)
      ? source.neutral
      : defaultRestaurantThemeConfig.neutral,
    radius: includesOption(restaurantThemeRadiusOptions, source.radius)
      ? source.radius
      : defaultRestaurantThemeConfig.radius,
    font: includesOption(restaurantThemeFontOptions, source.font)
      ? source.font
      : defaultRestaurantThemeConfig.font,
    icons: includesOption(restaurantThemeIconOptions, source.icons)
      ? source.icons
      : defaultRestaurantThemeConfig.icons,
    colorMode: includesOption(restaurantThemeColorModeOptions, source.colorMode)
      ? source.colorMode
      : defaultRestaurantThemeConfig.colorMode
  }
}
