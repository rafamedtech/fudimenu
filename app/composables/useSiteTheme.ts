import type { SiteThemeConfig } from '~~/lib/site-theme'
import {
  defaultSiteThemeConfig,
  getSiteThemeRootVariables,
  getSiteThemeStyle,
  resolveSiteThemeConfig,
  siteThemeAppIcons,
  siteThemeUiIcons
} from '~~/lib/site-theme'

const SITE_THEME_STORAGE_KEY = 'fudimenu-site-theme'

function sameTheme(a: SiteThemeConfig, b: SiteThemeConfig) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function resolveActiveMode(value: string | undefined): 'light' | 'dark' {
  return value === 'dark' ? 'dark' : 'light'
}

export function useSiteTheme() {
  const appConfig = useAppConfig()
  const theme = useState<SiteThemeConfig>('site-theme-config', () => ({ ...defaultSiteThemeConfig }))
  const initialized = useState('site-theme-initialized', () => false)
  const restored = useState('site-theme-restored-from-storage', () => false)
  const colorMode = useColorMode()

  if (import.meta.client && !restored.value) {
    restored.value = true

    try {
      const storedValue = window.localStorage.getItem(SITE_THEME_STORAGE_KEY)

      if (storedValue) {
        theme.value = resolveSiteThemeConfig(JSON.parse(storedValue))
      }
    } catch {
      window.localStorage.removeItem(SITE_THEME_STORAGE_KEY)
      theme.value = { ...defaultSiteThemeConfig }
    }
  }

  const appIcons = computed(() => siteThemeAppIcons[theme.value.icons])
  const themeStyle = computed(() => getSiteThemeStyle(theme.value))

  function applyDocumentTheme(value: SiteThemeConfig, modeValue: string | undefined) {
    if (!import.meta.client) {
      return
    }

    const root = document.documentElement
    const rootVariables = getSiteThemeRootVariables(value, resolveActiveMode(modeValue))

    Object.entries(rootVariables).forEach(([key, currentValue]) => {
      root.style.setProperty(key, currentValue)
    })
  }

  function applyRuntimeTheme(value: SiteThemeConfig, modeValue: string | undefined) {
    appConfig.ui.colors.primary = value.primary === 'black' ? 'sky' : value.primary
    appConfig.ui.colors.neutral = value.neutral
    appConfig.ui.icons = siteThemeUiIcons[value.icons]

    if (colorMode.preference !== value.colorMode) {
      colorMode.preference = value.colorMode
    }

    applyDocumentTheme(value, modeValue)
  }

  function updateTheme(patch: Partial<SiteThemeConfig>) {
    theme.value = resolveSiteThemeConfig({
      ...theme.value,
      ...patch
    })
  }

  function resetTheme() {
    theme.value = { ...defaultSiteThemeConfig }
  }

  if (!initialized.value) {
    initialized.value = true

    useHead({
      style: [
        {
          key: 'site-theme',
          innerHTML: () => themeStyle.value
        }
      ]
    })

    watch(
      [theme, () => colorMode.value],
      ([value, modeValue]) => {
        const nextValue = resolveSiteThemeConfig(value)

        if (!sameTheme(value, nextValue)) {
          theme.value = nextValue
          return
        }

        if (import.meta.client) {
          window.localStorage.setItem(SITE_THEME_STORAGE_KEY, JSON.stringify(nextValue))
        }

        applyRuntimeTheme(nextValue, modeValue)
      },
      {
        deep: true,
        immediate: true
      }
    )
  }

  return {
    theme,
    appConfig,
    appIcons,
    updateTheme,
    resetTheme
  }
}
