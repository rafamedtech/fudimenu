import {
  createSharedComposable,
  StorageSerializers,
  useLocalStorage
} from '@vueuse/core'
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

const useSiteThemeStorage = createSharedComposable(() =>
  useLocalStorage<SiteThemeConfig>(
    SITE_THEME_STORAGE_KEY,
    { ...defaultSiteThemeConfig },
    {
      serializer: StorageSerializers.object,
      mergeDefaults: true,
      writeDefaults: false
    }
  )
)

function sameTheme(a: SiteThemeConfig, b: SiteThemeConfig) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function resolveActiveMode(value: string | undefined): 'light' | 'dark' {
  return value === 'dark' ? 'dark' : 'light'
}

export function useSiteTheme() {
  const appConfig = useAppConfig()
  const theme = useState<SiteThemeConfig>('site-theme-config', () => ({ ...defaultSiteThemeConfig }))
  const colorMode = useColorMode()
  const appIcons = computed(() => siteThemeAppIcons[theme.value.icons])

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
    updateAppConfig({
      ui: {
        colors: {
          primary: value.primary === 'black' ? 'sky' : value.primary,
          neutral: value.neutral
        },
        icons: siteThemeUiIcons[value.icons]
      }
    })

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

  return {
    theme,
    appConfig,
    colorMode,
    appIcons,
    applyRuntimeTheme,
    updateTheme,
    resetTheme
  }
}

export function useSiteThemeSync() {
  const storageTheme = useSiteThemeStorage()
  const {
    theme,
    colorMode,
    applyRuntimeTheme
  } = useSiteTheme()
  const themeStyle = computed(() => getSiteThemeStyle(theme.value))

  useHead({
    style: [
      {
        key: 'site-theme',
        innerHTML: () => themeStyle.value
      }
    ]
  })

  watch(
    storageTheme,
    (value) => {
      const nextValue = resolveSiteThemeConfig(value)

      if (!sameTheme(theme.value, nextValue)) {
        theme.value = nextValue
      }
    },
    {
      deep: true,
      immediate: true
    }
  )

  watch(
    [theme, () => colorMode.value],
    ([value, modeValue]) => {
      const nextValue = resolveSiteThemeConfig(value)

      if (!sameTheme(value, nextValue)) {
        theme.value = nextValue
        return
      }

      if (!sameTheme(storageTheme.value, nextValue)) {
        storageTheme.value = { ...nextValue }
      }

      applyRuntimeTheme(nextValue, modeValue)
    },
    {
      deep: true,
      immediate: true
    }
  )
}
