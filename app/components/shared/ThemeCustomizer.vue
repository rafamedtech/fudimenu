<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import {
  siteThemeColorModeMeta,
  siteThemeFontMeta,
  siteThemeIconMeta,
  siteThemeNeutralMeta,
  siteThemePrimaryMeta,
  siteThemeRadiusMeta
} from '~~/lib/site-theme'

const { theme, appIcons, appConfig, updateTheme, resetTheme } = useSiteTheme()

type ThemeDropdownItem = DropdownMenuItem & {
  chip?: string
}

const items = computed<ThemeDropdownItem[][]>(() => ([
  [
    {
      label: 'Personaliza FudiMenu',
      icon: appIcons.value.settings,
      disabled: true
    }
  ],
  [
    {
      label: 'Theme',
      icon: appIcons.value.settings,
      children: [
        {
          label: 'Primary',
          slot: 'chip',
          chip: theme.value.primary,
          content: {
            align: 'center',
            collisionPadding: 16
          },
          children: siteThemePrimaryMeta.map(option => ({
            label: option.label,
            chip: option.value,
            slot: 'chip',
            type: 'checkbox',
            checked: theme.value.primary === option.value,
            onSelect: (event: Event) => {
              event.preventDefault()
              updateTheme({ primary: option.value })
            }
          }))
        },
        {
          label: 'Neutral',
          slot: 'chip',
          chip: appConfig.ui.colors.neutral,
          content: {
            align: 'end',
            collisionPadding: 16
          },
          children: siteThemeNeutralMeta.map(option => ({
            label: option.label,
            chip: option.value,
            slot: 'chip',
            type: 'checkbox',
            checked: theme.value.neutral === option.value,
            onSelect: (event: Event) => {
              event.preventDefault()
              updateTheme({ neutral: option.value })
            }
          }))
        },
        {
          label: 'Radius',
          children: siteThemeRadiusMeta.map(option => ({
            label: option.label,
            type: 'checkbox',
            checked: theme.value.radius === option.value,
            onSelect: (event: Event) => {
              event.preventDefault()
              updateTheme({ radius: option.value })
            }
          }))
        },
        {
          label: 'Font',
          children: siteThemeFontMeta.map(option => ({
            label: option.label,
            type: 'checkbox',
            checked: theme.value.font === option.value,
            onSelect: (event: Event) => {
              event.preventDefault()
              updateTheme({ font: option.value })
            }
          }))
        },
        {
          label: 'Icons',
          children: siteThemeIconMeta.map(option => ({
            label: option.label,
            icon: option.icon,
            type: 'checkbox',
            checked: theme.value.icons === option.value,
            onSelect: (event: Event) => {
              event.preventDefault()
              updateTheme({ icons: option.value })
            }
          }))
        }
      ]
    },
    {
      label: 'Appearance',
      icon: appIcons.value.system,
      children: siteThemeColorModeMeta.map(option => ({
        label: option.label,
        icon:
          option.value === 'light'
            ? appIcons.value.light
            : option.value === 'dark'
              ? appIcons.value.dark
              : appIcons.value.system,
        type: 'checkbox',
        checked: theme.value.colorMode === option.value,
        onSelect: (event: Event) => {
          event.preventDefault()
          updateTheme({ colorMode: option.value })
        }
      }))
    }
  ],
  [
    {
      label: 'Guardar localmente',
      icon: appIcons.value.check,
      disabled: true
    },
    {
      label: 'Reset',
      icon: appIcons.value.refresh,
      onSelect: () => {
        resetTheme()
      }
    }
  ]
]))

function chipCssVariable(chip: string, shade: 'light' | 'dark') {
  if (chip === 'black') {
    return shade === 'dark' ? '#f8fafc' : '#111827'
  }

  return `var(--color-${chip}-${shade === 'dark' ? '400' : '500'})`
}
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'end', side: 'bottom', sideOffset: 12, collisionPadding: 12 }"
    :ui="{ content: 'w-[min(22rem,calc(100vw-2rem))]' }"
  >
    <UiButton
      :icon="appIcons.settings"
      aria-label="Personalizar apariencia"
      intent="ghost"
      size="sm"
    >
      <span class="hidden sm:inline">Personalizar</span>
    </UiButton>

    <template #chip-leading="{ item }">
      <div class="inline-flex size-5 shrink-0 items-center justify-center">
        <span
          class="size-2.5 rounded-full ring ring-default bg-(--chip-light) dark:bg-(--chip-dark)"
          :style="{
            '--chip-light': chipCssVariable((item as ThemeDropdownItem).chip ?? 'sky', 'light'),
            '--chip-dark': chipCssVariable((item as ThemeDropdownItem).chip ?? 'sky', 'dark')
          }"
        />
      </div>
    </template>
  </UDropdownMenu>
</template>
