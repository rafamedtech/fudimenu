export const siteThemePrimaryOptions = [
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

export const siteThemeNeutralOptions = [
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

export const siteThemeRadiusOptions = ['0', '0.125', '0.25', '0.375', '0.5'] as const
export const siteThemeColorModeOptions = ['light', 'dark', 'system'] as const
export const siteThemeFontOptions = ['public-sans', 'plus-jakarta-sans', 'system-sans'] as const
export const siteThemeIconOptions = ['lucide', 'heroicons'] as const

export type SiteThemePrimary = (typeof siteThemePrimaryOptions)[number]
export type SiteThemeNeutral = (typeof siteThemeNeutralOptions)[number]
export type SiteThemeRadius = (typeof siteThemeRadiusOptions)[number]
export type SiteThemeColorMode = (typeof siteThemeColorModeOptions)[number]
export type SiteThemeFont = (typeof siteThemeFontOptions)[number]
export type SiteThemeIcons = (typeof siteThemeIconOptions)[number]

export interface SiteThemeConfig {
  primary: SiteThemePrimary
  neutral: SiteThemeNeutral
  radius: SiteThemeRadius
  font: SiteThemeFont
  icons: SiteThemeIcons
  colorMode: SiteThemeColorMode
}

export const defaultSiteThemeConfig: SiteThemeConfig = {
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

export function resolveSiteThemeConfig(value: unknown): SiteThemeConfig {
  const source = isRecord(value) ? value : {}

  return {
    primary: includesOption(siteThemePrimaryOptions, source.primary)
      ? source.primary
      : defaultSiteThemeConfig.primary,
    neutral: includesOption(siteThemeNeutralOptions, source.neutral)
      ? source.neutral
      : defaultSiteThemeConfig.neutral,
    radius: includesOption(siteThemeRadiusOptions, source.radius)
      ? source.radius
      : defaultSiteThemeConfig.radius,
    font: includesOption(siteThemeFontOptions, source.font)
      ? source.font
      : defaultSiteThemeConfig.font,
    icons: includesOption(siteThemeIconOptions, source.icons)
      ? source.icons
      : defaultSiteThemeConfig.icons,
    colorMode: includesOption(siteThemeColorModeOptions, source.colorMode)
      ? source.colorMode
      : defaultSiteThemeConfig.colorMode
  }
}

export const siteThemePrimaryMeta: Array<{
  value: SiteThemePrimary
  label: string
  swatch: string
}> = [
  { value: 'black', label: 'Black', swatch: '#111827' },
  { value: 'red', label: 'Red', swatch: '#ef4444' },
  { value: 'orange', label: 'Orange', swatch: '#f97316' },
  { value: 'amber', label: 'Amber', swatch: '#f59e0b' },
  { value: 'yellow', label: 'Yellow', swatch: '#eab308' },
  { value: 'lime', label: 'Lime', swatch: '#84cc16' },
  { value: 'green', label: 'Green', swatch: '#22c55e' },
  { value: 'emerald', label: 'Emerald', swatch: '#10b981' },
  { value: 'teal', label: 'Teal', swatch: '#14b8a6' },
  { value: 'cyan', label: 'Cyan', swatch: '#06b6d4' },
  { value: 'sky', label: 'Sky', swatch: '#0ea5e9' },
  { value: 'blue', label: 'Blue', swatch: '#3b82f6' },
  { value: 'indigo', label: 'Indigo', swatch: '#6366f1' },
  { value: 'violet', label: 'Violet', swatch: '#8b5cf6' },
  { value: 'purple', label: 'Purple', swatch: '#a855f7' },
  { value: 'fuchsia', label: 'Fuchsia', swatch: '#d946ef' },
  { value: 'pink', label: 'Pink', swatch: '#ec4899' },
  { value: 'rose', label: 'Rose', swatch: '#f43f5e' }
]

export const siteThemeNeutralMeta: Array<{
  value: SiteThemeNeutral
  label: string
  swatch: string
}> = [
  { value: 'slate', label: 'Slate', swatch: '#64748b' },
  { value: 'gray', label: 'Gray', swatch: '#6b7280' },
  { value: 'zinc', label: 'Zinc', swatch: '#71717a' },
  { value: 'neutral', label: 'Neutral', swatch: '#737373' },
  { value: 'stone', label: 'Stone', swatch: '#78716c' },
  { value: 'taupe', label: 'Taupe', swatch: '#8b7d72' },
  { value: 'mauve', label: 'Mauve', swatch: '#7c6f7d' },
  { value: 'mist', label: 'Mist', swatch: '#7f8c8d' },
  { value: 'olive', label: 'Olive', swatch: '#7c7a5a' }
]

export const siteThemeRadiusMeta: Array<{
  value: SiteThemeRadius
  label: string
}> = [
  { value: '0', label: '0' },
  { value: '0.125', label: '0.125' },
  { value: '0.25', label: '0.25' },
  { value: '0.375', label: '0.375' },
  { value: '0.5', label: '0.5' }
]

export const siteThemeFontMeta: Array<{
  label: string
  value: SiteThemeFont
  previewFamily: string
}> = [
  {
    label: 'Public Sans',
    value: 'public-sans',
    previewFamily: '"Public Sans", "Plus Jakarta Sans", "Avenir Next", "Segoe UI", sans-serif'
  },
  {
    label: 'Plus Jakarta Sans',
    value: 'plus-jakarta-sans',
    previewFamily: '"Plus Jakarta Sans", "Public Sans", "Avenir Next", "Segoe UI", sans-serif'
  },
  {
    label: 'System Sans',
    value: 'system-sans',
    previewFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  }
]

export const siteThemeIconMeta: Array<{
  label: string
  value: SiteThemeIcons
  icon: string
}> = [
  { label: 'Lucide', value: 'lucide', icon: 'i-lucide-sparkles' },
  { label: 'Heroicons', value: 'heroicons', icon: 'i-lucide-swatch-book' }
]

export const siteThemeColorModeMeta: Array<{
  label: string
  value: SiteThemeColorMode
}> = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' }
]

const lucideUiIcons = {
  arrowDown: 'i-lucide-arrow-down',
  arrowLeft: 'i-lucide-arrow-left',
  arrowRight: 'i-lucide-arrow-right',
  arrowUp: 'i-lucide-arrow-up',
  caution: 'i-lucide-circle-alert',
  check: 'i-lucide-check',
  chevronDoubleLeft: 'i-lucide-chevrons-left',
  chevronDoubleRight: 'i-lucide-chevrons-right',
  chevronDown: 'i-lucide-chevron-down',
  chevronLeft: 'i-lucide-chevron-left',
  chevronRight: 'i-lucide-chevron-right',
  chevronUp: 'i-lucide-chevron-up',
  close: 'i-lucide-x',
  copy: 'i-lucide-copy',
  copyCheck: 'i-lucide-copy-check',
  dark: 'i-lucide-moon',
  drag: 'i-lucide-grip-vertical',
  ellipsis: 'i-lucide-ellipsis',
  error: 'i-lucide-circle-x',
  external: 'i-lucide-arrow-up-right',
  eye: 'i-lucide-eye',
  eyeOff: 'i-lucide-eye-off',
  file: 'i-lucide-file',
  folder: 'i-lucide-folder',
  folderOpen: 'i-lucide-folder-open',
  hash: 'i-lucide-hash',
  info: 'i-lucide-info',
  light: 'i-lucide-sun',
  loading: 'i-lucide-loader-circle',
  menu: 'i-lucide-menu',
  minus: 'i-lucide-minus',
  panelClose: 'i-lucide-panel-left-close',
  panelOpen: 'i-lucide-panel-left-open',
  plus: 'i-lucide-plus',
  reload: 'i-lucide-rotate-ccw',
  search: 'i-lucide-search',
  stop: 'i-lucide-square',
  success: 'i-lucide-circle-check',
  system: 'i-lucide-monitor',
  tip: 'i-lucide-lightbulb',
  upload: 'i-lucide-upload',
  warning: 'i-lucide-triangle-alert'
} as const

const heroiconsUiIcons = {
  arrowDown: 'i-heroicons-arrow-down',
  arrowLeft: 'i-heroicons-arrow-left',
  arrowRight: 'i-heroicons-arrow-right',
  arrowUp: 'i-heroicons-arrow-up',
  caution: 'i-heroicons-exclamation-triangle',
  check: 'i-heroicons-check',
  chevronDoubleLeft: 'i-heroicons-chevron-double-left',
  chevronDoubleRight: 'i-heroicons-chevron-double-right',
  chevronDown: 'i-heroicons-chevron-down',
  chevronLeft: 'i-heroicons-chevron-left',
  chevronRight: 'i-heroicons-chevron-right',
  chevronUp: 'i-heroicons-chevron-up',
  close: 'i-heroicons-x-mark',
  copy: 'i-heroicons-document-duplicate',
  copyCheck: 'i-heroicons-clipboard-document-check',
  dark: 'i-heroicons-moon',
  drag: 'i-heroicons-bars-3-center-left',
  ellipsis: 'i-heroicons-ellipsis-horizontal',
  error: 'i-heroicons-x-circle',
  external: 'i-heroicons-arrow-top-right-on-square',
  eye: 'i-heroicons-eye',
  eyeOff: 'i-heroicons-eye-slash',
  file: 'i-heroicons-document',
  folder: 'i-heroicons-folder',
  folderOpen: 'i-heroicons-folder-open',
  hash: 'i-heroicons-hashtag',
  info: 'i-heroicons-information-circle',
  light: 'i-heroicons-sun',
  loading: 'i-heroicons-arrow-path',
  menu: 'i-heroicons-bars-3',
  minus: 'i-heroicons-minus',
  panelClose: 'i-heroicons-chevron-double-left',
  panelOpen: 'i-heroicons-chevron-double-right',
  plus: 'i-heroicons-plus',
  reload: 'i-heroicons-arrow-path',
  search: 'i-heroicons-magnifying-glass',
  stop: 'i-heroicons-stop',
  success: 'i-heroicons-check-circle',
  system: 'i-heroicons-computer-desktop',
  tip: 'i-heroicons-light-bulb',
  upload: 'i-heroicons-arrow-up-tray',
  warning: 'i-heroicons-exclamation-triangle'
} as const

export const siteThemeUiIcons = {
  lucide: lucideUiIcons,
  heroicons: heroiconsUiIcons
} as const

export const siteThemeAppIcons: Record<
  SiteThemeIcons,
  {
    settings: string
    compass: string
    dashboard: string
    login: string
    logout: string
    globe: string
    store: string
    plus: string
    light: string
    dark: string
    system: string
    help: string
    mapPin: string
    link: string
    external: string
    refresh: string
    utensils: string
    back: string
    forward: string
    down: string
    check: string
  }
> = {
  lucide: {
    settings: 'i-lucide-swatch-book',
    compass: 'i-lucide-compass',
    dashboard: 'i-lucide-layout-dashboard',
    login: 'i-lucide-log-in',
    logout: 'i-lucide-log-out',
    globe: 'i-lucide-globe',
    store: 'i-lucide-store',
    plus: 'i-lucide-plus',
    light: 'i-lucide-sun-medium',
    dark: 'i-lucide-moon-star',
    system: 'i-lucide-monitor',
    help: 'i-lucide-circle-help',
    mapPin: 'i-lucide-map-pin',
    link: 'i-lucide-link-2',
    external: 'i-lucide-arrow-up-right',
    refresh: 'i-lucide-refresh-cw',
    utensils: 'i-lucide-utensils-crossed',
    back: 'i-lucide-arrow-left',
    forward: 'i-lucide-arrow-right',
    down: 'i-lucide-arrow-down',
    check: 'i-lucide-check'
  },
  heroicons: {
    settings: 'i-heroicons-paint-brush',
    compass: 'i-heroicons-compass',
    dashboard: 'i-heroicons-squares-2x2',
    login: 'i-heroicons-arrow-right-on-rectangle',
    logout: 'i-heroicons-arrow-left-on-rectangle',
    globe: 'i-heroicons-globe-alt',
    store: 'i-heroicons-building-storefront',
    plus: 'i-heroicons-plus',
    light: 'i-heroicons-sun',
    dark: 'i-heroicons-moon',
    system: 'i-heroicons-computer-desktop',
    help: 'i-heroicons-question-mark-circle',
    mapPin: 'i-heroicons-map-pin',
    link: 'i-heroicons-link',
    external: 'i-heroicons-arrow-top-right-on-square',
    refresh: 'i-heroicons-arrow-path',
    utensils: 'i-heroicons-sparkles',
    back: 'i-heroicons-arrow-left',
    forward: 'i-heroicons-arrow-right',
    down: 'i-heroicons-arrow-down',
    check: 'i-heroicons-check'
  }
}

export function getSiteThemeFontFamily(font: SiteThemeFont) {
  return siteThemeFontMeta.find(option => option.value === font)?.previewFamily
    ?? siteThemeFontMeta[0]!.previewFamily
}

export function getSiteThemeUiColors(config: SiteThemeConfig) {
  return {
    primary: config.primary === 'black' ? 'sky' : config.primary,
    secondary: 'amber',
    neutral: config.neutral
  }
}

export function getSiteThemeStyle(config: SiteThemeConfig) {
  const lightVariables = getSiteThemeRootVariables(config, 'light')
  const darkVariables = getSiteThemeRootVariables(config, 'dark')

  return `
:root {
  ${Object.entries(lightVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n  ')}
}

.dark {
  ${Object.entries(darkVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n  ')}
}
  `.trim()
}

export function getSiteThemeRootVariables(
  config: SiteThemeConfig,
  mode: 'light' | 'dark'
) {
  const fontFamily = getSiteThemeFontFamily(config.font)
  const primaryShade = mode === 'dark' ? '400' : '500'
  const primaryValue =
    config.primary === 'black'
      ? mode === 'dark'
        ? '#f8fafc'
        : '#111827'
      : `var(--ui-color-primary-${primaryShade})`

  return {
    '--font-sans': fontFamily,
    '--font-serif': fontFamily,
    '--ui-radius': `${config.radius}rem`,
    '--ui-container': '1180px',
    '--ui-primary': primaryValue
  } as const
}
