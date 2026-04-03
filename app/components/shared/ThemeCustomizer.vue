<script setup lang="ts">
import {
  siteThemeColorModeMeta,
  siteThemeNeutralMeta,
  siteThemePrimaryMeta
} from '~~/lib/site-theme'

const { theme, appIcons, updateTheme, resetTheme } = useSiteTheme()

const optionButtonUi = {
  base: 'h-9 w-full rounded-[calc(var(--ui-radius)*3)] px-2.5 text-[0.6875rem] font-medium shadow-none'
} as const

function optionButtonClass(active: boolean, align: 'start' | 'center' = 'start') {
  return [
    align === 'center' ? 'justify-center' : 'justify-start',
    active ? 'ring-2 ring-inset ring-white/70 dark:ring-black/20' : 'hover:opacity-92'
  ].join(' ')
}

function optionButtonColor(active: boolean): 'primary' | 'neutral' {
  return active ? 'primary' : 'neutral'
}

function optionButtonVariant(active: boolean): 'soft' | 'outline' {
  return active ? 'soft' : 'outline'
}

function colorModeIcon(value: 'light' | 'dark' | 'system') {
  if (value === 'light') {
    return appIcons.value.light
  }

  if (value === 'dark') {
    return appIcons.value.dark
  }

  return appIcons.value.system
}

function getOptionSurfaceStyle(swatch: string, active: boolean) {
  return {
    backgroundColor: active
      ? `color-mix(in srgb, ${swatch} 32%, var(--ui-bg) 68%)`
      : `color-mix(in srgb, ${swatch} 18%, var(--ui-bg) 82%)`,
    borderColor: active
      ? `color-mix(in srgb, ${swatch} 55%, var(--ui-border) 45%)`
      : `color-mix(in srgb, ${swatch} 28%, var(--ui-border) 72%)`,
    color: `color-mix(in srgb, ${swatch} 78%, var(--ui-text-highlighted) 22%)`
  }
}
</script>

<template>
  <UPopover
    :content="{ align: 'end', side: 'bottom', sideOffset: 12, collisionPadding: 12 }"
    :ui="{ content: 'bg-transparent shadow-none ring-0 p-0' }"
  >
    <UiButton
      :icon="appIcons.settings"
      aria-label="Personalizar apariencia"
      intent="ghost"
      size="sm"
    >
      <span class="hidden sm:inline">Personalizar</span>
    </UiButton>

    <template #content>
      <UCard
        :ui="{
          root: 'w-[min(21.25rem,calc(100vw-0.75rem))] overflow-hidden rounded-[calc(var(--ui-radius)*5)] border border-default bg-default shadow-xl backdrop-blur-none',
          body: 'p-4'
        }"
      >
        <div class="space-y-5">
          <section class="space-y-2.5">
            <div class="flex items-center gap-1.5">
              <h3 class="text-sm font-semibold text-highlighted">
                Primary
              </h3>
              <UTooltip text="Color principal del sistema visual de la app.">
                <UIcon :name="appIcons.help" class="size-4 text-muted" />
              </UTooltip>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <UButton
                v-for="option in siteThemePrimaryMeta"
                :key="option.value"
                color="neutral"
                :class="optionButtonClass(theme.primary === option.value)"
                :style="getOptionSurfaceStyle(option.swatch, theme.primary === option.value)"
                :ui="optionButtonUi"
                variant="subtle"
                type="button"
                @click="updateTheme({ primary: option.value })"
              >
                <span class="flex min-w-0 items-center">
                  <span class="truncate">{{ option.label }}</span>
                </span>
              </UButton>
            </div>
          </section>

          <section class="space-y-2.5">
            <div class="flex items-center gap-1.5">
              <h3 class="text-sm font-semibold text-highlighted">
                Neutral
              </h3>
              <UTooltip text="Base de fondos, bordes y superficies.">
                <UIcon :name="appIcons.help" class="size-4 text-muted" />
              </UTooltip>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <UButton
                v-for="option in siteThemeNeutralMeta"
                :key="option.value"
                color="neutral"
                :class="optionButtonClass(theme.neutral === option.value)"
                :style="getOptionSurfaceStyle(option.swatch, theme.neutral === option.value)"
                :ui="optionButtonUi"
                variant="subtle"
                type="button"
                @click="updateTheme({ neutral: option.value })"
              >
                <span class="flex min-w-0 items-center">
                  <span class="truncate">{{ option.label }}</span>
                </span>
              </UButton>
            </div>
          </section>

          <section class="space-y-2.5">
            <div class="flex items-center gap-1.5">
              <h3 class="text-sm font-semibold text-highlighted">
                Color Mode
              </h3>
              <UTooltip text="Modo claro, oscuro o según el sistema.">
                <UIcon :name="appIcons.help" class="size-4 text-muted" />
              </UTooltip>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <UButton
                v-for="option in siteThemeColorModeMeta"
                :key="option.value"
                :color="optionButtonColor(theme.colorMode === option.value)"
                :class="optionButtonClass(theme.colorMode === option.value, 'center')"
                :ui="optionButtonUi"
                :variant="optionButtonVariant(theme.colorMode === option.value)"
                type="button"
                @click="updateTheme({ colorMode: option.value })"
              >
                <span class="flex items-center gap-2">
                  <UIcon :name="colorModeIcon(option.value)" class="size-4" />
                  <span>{{ option.label }}</span>
                </span>
              </UButton>
            </div>
          </section>

          <div class="flex items-center justify-end pt-1">
            <UButton
              color="neutral"
              :icon="appIcons.refresh"
              size="sm"
              variant="ghost"
              @click="resetTheme()"
            >
              Reset
            </UButton>
          </div>
        </div>
      </UCard>
    </template>
  </UPopover>
</template>
