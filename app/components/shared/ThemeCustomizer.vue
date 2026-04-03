<script setup lang="ts">
import type {
  SiteThemeFont,
  SiteThemeIcons
} from '~~/lib/site-theme'
import {
  siteThemeColorModeMeta,
  siteThemeFontMeta,
  siteThemeIconMeta,
  siteThemeNeutralMeta,
  siteThemePrimaryMeta,
  siteThemeRadiusMeta
} from '~~/lib/site-theme'

const { theme, appIcons, updateTheme, resetTheme } = useSiteTheme()

const fontModel = computed({
  get: () => theme.value.font,
  set: (value: SiteThemeFont) => updateTheme({ font: value })
})

const iconsModel = computed({
  get: () => theme.value.icons,
  set: (value: SiteThemeIcons) => updateTheme({ icons: value })
})

const currentFont = computed(() =>
  siteThemeFontMeta.find(option => option.value === theme.value.font) ?? siteThemeFontMeta[0]!
)

const currentIconSet = computed(() =>
  siteThemeIconMeta.find(option => option.value === theme.value.icons) ?? siteThemeIconMeta[0]!
)

const optionButtonUi = {
  base: 'h-9 w-full rounded-lg px-3 text-[0.8125rem] font-medium shadow-none'
} as const

const selectUi = {
  base: 'min-h-10 rounded-lg border border-default bg-default px-3 text-sm text-default shadow-none',
  content: 'rounded-xl border border-default bg-default shadow-xl',
  trailingIcon: 'size-4 text-muted'
} as const

function optionButtonClass(active: boolean, align: 'start' | 'center' = 'start') {
  return [
    align === 'center' ? 'justify-center' : 'justify-start',
    active ? 'ring-1 ring-primary/25' : 'hover:bg-elevated'
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
</script>

<template>
  <UPopover :content="{ align: 'end', side: 'bottom', sideOffset: 12, collisionPadding: 12 }">
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
          root: 'w-[min(18.5rem,calc(100vw-0.75rem))] overflow-hidden rounded-2xl border border-default bg-default shadow-xl backdrop-blur-none',
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
                :color="optionButtonColor(theme.primary === option.value)"
                :class="optionButtonClass(theme.primary === option.value)"
                :ui="optionButtonUi"
                :variant="optionButtonVariant(theme.primary === option.value)"
                type="button"
                @click="updateTheme({ primary: option.value })"
              >
                <span class="flex items-center gap-2">
                  <span class="size-2.5 rounded-full" :style="{ backgroundColor: option.swatch }" />
                  <span>{{ option.label }}</span>
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
                :color="optionButtonColor(theme.neutral === option.value)"
                :class="optionButtonClass(theme.neutral === option.value)"
                :ui="optionButtonUi"
                :variant="optionButtonVariant(theme.neutral === option.value)"
                type="button"
                @click="updateTheme({ neutral: option.value })"
              >
                <span class="flex items-center gap-2">
                  <span class="size-2.5 rounded-full" :style="{ backgroundColor: option.swatch }" />
                  <span>{{ option.label }}</span>
                </span>
              </UButton>
            </div>
          </section>

          <section class="space-y-2.5">
            <div class="flex items-center gap-1.5">
              <h3 class="text-sm font-semibold text-highlighted">
                Radius
              </h3>
              <UTooltip text="Radio base para botones, tarjetas y paneles.">
                <UIcon :name="appIcons.help" class="size-4 text-muted" />
              </UTooltip>
            </div>

            <div class="grid grid-cols-5 gap-2">
              <UButton
                v-for="option in siteThemeRadiusMeta"
                :key="option.value"
                :color="optionButtonColor(theme.radius === option.value)"
                :class="optionButtonClass(theme.radius === option.value, 'center')"
                :ui="optionButtonUi"
                :variant="optionButtonVariant(theme.radius === option.value)"
                type="button"
                @click="updateTheme({ radius: option.value })"
              >
                {{ option.label }}
              </UButton>
            </div>
          </section>

          <section class="space-y-2.5">
            <div class="flex items-center gap-1.5">
              <h3 class="text-sm font-semibold text-highlighted">
                Font
              </h3>
              <UTooltip text="Tipografía base del sitio.">
                <UIcon :name="appIcons.help" class="size-4 text-muted" />
              </UTooltip>
            </div>

            <USelect
              v-model="fontModel"
              :items="siteThemeFontMeta"
              color="neutral"
              label-key="label"
              :ui="selectUi"
              value-key="value"
              variant="outline"
            >
              <template #leading>
                <span
                  class="inline-flex size-5 items-center justify-center text-[1.05rem] text-muted"
                  :style="{ fontFamily: currentFont.previewFamily }"
                >
                  T
                </span>
              </template>

              <template #item-leading="{ item }">
                <span
                  class="inline-flex size-5 items-center justify-center text-[1.05rem] text-muted"
                  :style="{ fontFamily: item.previewFamily }"
                >
                  T
                </span>
              </template>
            </USelect>
          </section>

          <section class="space-y-2.5">
            <div class="flex items-center gap-1.5">
              <h3 class="text-sm font-semibold text-highlighted">
                Icons
              </h3>
              <UTooltip text="Colección de iconos del design system global.">
                <UIcon :name="appIcons.help" class="size-4 text-muted" />
              </UTooltip>
            </div>

            <USelect
              v-model="iconsModel"
              :items="siteThemeIconMeta"
              color="neutral"
              label-key="label"
              :ui="selectUi"
              value-key="value"
              variant="outline"
            >
              <template #leading>
                <UIcon :name="currentIconSet.icon" class="size-4 text-muted" />
              </template>

              <template #item-leading="{ item }">
                <UIcon :name="item.icon" class="size-4 text-muted" />
              </template>
            </USelect>
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
