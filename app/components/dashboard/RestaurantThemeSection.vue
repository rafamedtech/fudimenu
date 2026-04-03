<script setup lang="ts">
import {
  type RestaurantThemeColorMode,
  type RestaurantThemeConfig,
  type RestaurantThemeFont,
  type RestaurantThemeIcons,
  type RestaurantThemeNeutral,
  type RestaurantThemePrimary,
  type RestaurantThemeRadius,
  defaultRestaurantThemeConfig
} from '~~/lib/restaurant-theme'

const props = withDefaults(
  defineProps<{
    modelValue?: RestaurantThemeConfig
    restaurantName?: string | null
  }>(),
  {
    modelValue: () => ({ ...defaultRestaurantThemeConfig }),
    restaurantName: ''
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: RestaurantThemeConfig]
}>()

const primaryOptions: Array<{ value: RestaurantThemePrimary, label: string, swatch: string }> = [
  { value: 'black', label: 'Black', swatch: '#0f172a' },
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

const neutralOptions: Array<{ value: RestaurantThemeNeutral, label: string, swatch: string }> = [
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

const radiusOptions: Array<{ value: RestaurantThemeRadius, label: string }> = [
  { value: '0', label: '0' },
  { value: '0.125', label: '0.125' },
  { value: '0.25', label: '0.25' },
  { value: '0.375', label: '0.375' },
  { value: '0.5', label: '0.5' }
]

const fontOptions: Array<{ label: string, value: RestaurantThemeFont, previewFamily: string }> = [
  {
    label: 'Public Sans',
    value: 'public-sans',
    previewFamily: '"Public Sans", "Plus Jakarta Sans", "Avenir Next", "Segoe UI", sans-serif'
  },
  {
    label: 'Plus Jakarta Sans',
    value: 'plus-jakarta-sans',
    previewFamily: '"Plus Jakarta Sans", "Avenir Next", "Segoe UI", sans-serif'
  },
  {
    label: 'System Sans',
    value: 'system-sans',
    previewFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  }
]

const iconOptions: Array<{ label: string, value: RestaurantThemeIcons, icon: string }> = [
  { label: 'Lucide', value: 'lucide', icon: 'i-lucide-sparkles' },
  { label: 'Heroicons', value: 'heroicons', icon: 'i-lucide-shapes' }
]

const colorModeOptions: Array<{
  label: string
  value: RestaurantThemeColorMode
  icon: string
}> = [
  { label: 'Light', value: 'light', icon: 'i-lucide-sun-medium' },
  { label: 'Dark', value: 'dark', icon: 'i-lucide-moon-star' },
  { label: 'System', value: 'system', icon: 'i-lucide-monitor' }
]

function updateConfig(patch: Partial<RestaurantThemeConfig>) {
  emit('update:modelValue', {
    ...defaultRestaurantThemeConfig,
    ...props.modelValue,
    ...patch
  })
}

const fontModel = computed({
  get: () => props.modelValue.font,
  set: (value: RestaurantThemeFont) => updateConfig({ font: value })
})

const iconsModel = computed({
  get: () => props.modelValue.icons,
  set: (value: RestaurantThemeIcons) => updateConfig({ icons: value })
})

const primaryMeta = computed<(typeof primaryOptions)[number]>(() =>
  primaryOptions.find(option => option.value === props.modelValue.primary) ?? primaryOptions[10]!
)

const neutralMeta = computed<(typeof neutralOptions)[number]>(() =>
  neutralOptions.find(option => option.value === props.modelValue.neutral) ?? neutralOptions[4]!
)

const fontMeta = computed<(typeof fontOptions)[number]>(() =>
  fontOptions.find(option => option.value === props.modelValue.font) ?? fontOptions[0]!
)

const iconMeta = computed<(typeof iconOptions)[number]>(() =>
  iconOptions.find(option => option.value === props.modelValue.icons) ?? iconOptions[0]!
)

const previewName = computed(() => props.restaurantName?.trim() || 'Tu restaurante')

const previewCardStyle = computed(() => {
  const isDark = props.modelValue.colorMode === 'dark'

  return {
    borderRadius: `${props.modelValue.radius}rem`,
    background: isDark
      ? 'linear-gradient(180deg, rgba(17,24,39,0.98) 0%, rgba(30,41,59,0.98) 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
    color: isDark ? '#f8fafc' : '#0f172a',
    border: `1px solid ${isDark ? 'rgba(148,163,184,0.22)' : 'rgba(148,163,184,0.28)'}`,
    fontFamily: fontMeta.value.previewFamily
  }
})

const previewHeroStyle = computed(() => ({
  borderRadius: `${props.modelValue.radius}rem`,
  background: `linear-gradient(135deg, ${primaryMeta.value.swatch}22 0%, ${neutralMeta.value.swatch}20 100%)`,
  border: `1px solid ${primaryMeta.value.swatch}33`
}))

const previewButtonStyle = computed(() => ({
  borderRadius: `${props.modelValue.radius}rem`,
  backgroundColor: primaryMeta.value.swatch
}))

function optionButtonClass(active: boolean) {
  return [
    'justify-start rounded-xl px-3 py-2.5 text-left transition',
    active ? 'ring-2 ring-primary/40 border-primary/50 bg-primary/10' : 'border-default/70 hover:bg-muted/60'
  ]
}

function modeButtonClass(active: boolean) {
  return [
    'justify-center rounded-xl px-3 py-2.5 transition',
    active ? 'ring-2 ring-primary/40 border-primary/50 bg-primary/10' : 'border-default/70 hover:bg-muted/60'
  ]
}
</script>

<template>
  <UCard :ui="{ body: 'p-5 sm:p-6' }">
    <div class="space-y-6">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <p class="eyebrow">Personalización</p>
          <h2 class="text-xl font-semibold text-highlighted">
            Ajusta el estilo del restaurante
          </h2>
          <p class="text-sm leading-6 text-muted">
            Define color principal, neutros, radio, tipografía e interfaz base del restaurante desde el dashboard.
          </p>
        </div>

        <UBadge color="neutral" variant="soft">
          Se guarda en tu restaurante
        </UBadge>
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.9fr)]">
        <div class="space-y-6">
          <section class="space-y-3">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold text-highlighted">
                Primary
              </h3>
              <UTooltip text="Color principal para acciones, acentos y llamadas visuales.">
                <UIcon class="size-4 text-muted" name="i-lucide-circle-help" />
              </UTooltip>
            </div>

            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <UButton
                v-for="option in primaryOptions"
                :key="option.value"
                color="neutral"
                :class="optionButtonClass(modelValue.primary === option.value)"
                :variant="modelValue.primary === option.value ? 'soft' : 'outline'"
                type="button"
                @click="updateConfig({ primary: option.value })"
              >
                <span class="flex items-center gap-2">
                  <span class="size-2.5 rounded-full" :style="{ backgroundColor: option.swatch }" />
                  <span>{{ option.label }}</span>
                </span>
              </UButton>
            </div>
          </section>

          <section class="space-y-3">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold text-highlighted">
                Neutral
              </h3>
              <UTooltip text="Base cromática para fondos, bordes y superficies.">
                <UIcon class="size-4 text-muted" name="i-lucide-circle-help" />
              </UTooltip>
            </div>

            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <UButton
                v-for="option in neutralOptions"
                :key="option.value"
                color="neutral"
                :class="optionButtonClass(modelValue.neutral === option.value)"
                :variant="modelValue.neutral === option.value ? 'soft' : 'outline'"
                type="button"
                @click="updateConfig({ neutral: option.value })"
              >
                <span class="flex items-center gap-2">
                  <span class="size-2.5 rounded-full" :style="{ backgroundColor: option.swatch }" />
                  <span>{{ option.label }}</span>
                </span>
              </UButton>
            </div>
          </section>

          <section class="space-y-3">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold text-highlighted">
                Radius
              </h3>
              <UTooltip text="Qué tan redondeados se sienten tus botones, tarjetas y paneles.">
                <UIcon class="size-4 text-muted" name="i-lucide-circle-help" />
              </UTooltip>
            </div>

            <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
              <UButton
                v-for="option in radiusOptions"
                :key="option.value"
                color="neutral"
                :class="modeButtonClass(modelValue.radius === option.value)"
                :variant="modelValue.radius === option.value ? 'soft' : 'outline'"
                type="button"
                @click="updateConfig({ radius: option.value })"
              >
                {{ option.label }}
              </UButton>
            </div>
          </section>

          <div class="grid gap-4 sm:grid-cols-2">
            <section class="space-y-3">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-semibold text-highlighted">
                  Font
                </h3>
                <UTooltip text="Familia tipográfica base para el restaurante.">
                  <UIcon class="size-4 text-muted" name="i-lucide-circle-help" />
                </UTooltip>
              </div>

              <USelect
                v-model="fontModel"
                :items="fontOptions"
                color="neutral"
                label-key="label"
                placeholder="Selecciona tipografía"
                size="lg"
                value-key="value"
                variant="outline"
              />
            </section>

            <section class="space-y-3">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-semibold text-highlighted">
                  Icons
                </h3>
                <UTooltip text="Set preferido para iconografía futura del restaurante.">
                  <UIcon class="size-4 text-muted" name="i-lucide-circle-help" />
                </UTooltip>
              </div>

              <USelect
                v-model="iconsModel"
                :items="iconOptions"
                color="neutral"
                label-key="label"
                placeholder="Selecciona iconos"
                size="lg"
                value-key="value"
                variant="outline"
              >
                <template #item-leading="{ item }">
                  <UIcon :name="item.icon" class="size-4 text-muted" />
                </template>
              </USelect>
            </section>
          </div>

          <section class="space-y-3">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold text-highlighted">
                Color Mode
              </h3>
              <UTooltip text="Modo visual que el restaurante prefiere como base.">
                <UIcon class="size-4 text-muted" name="i-lucide-circle-help" />
              </UTooltip>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <UButton
                v-for="option in colorModeOptions"
                :key="option.value"
                color="neutral"
                :class="modeButtonClass(modelValue.colorMode === option.value)"
                :variant="modelValue.colorMode === option.value ? 'soft' : 'outline'"
                type="button"
                @click="updateConfig({ colorMode: option.value })"
              >
                <span class="flex items-center gap-2">
                  <UIcon :name="option.icon" class="size-4" />
                  <span>{{ option.label }}</span>
                </span>
              </UButton>
            </div>
          </section>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-sm font-semibold text-highlighted">
              Vista previa
            </h3>

            <UBadge color="neutral" variant="outline">
              {{ primaryMeta.label }} / {{ neutralMeta.label }}
            </UBadge>
          </div>

          <div class="space-y-4 rounded-[1.75rem] border border-dashed border-default p-3">
            <div class="overflow-hidden p-4 shadow-sm" :style="previewCardStyle">
              <div class="space-y-4">
                <div class="p-4" :style="previewHeroStyle">
                  <div class="flex items-start justify-between gap-3">
                    <div class="space-y-2">
                      <p class="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
                        Preview
                      </p>
                      <h4 class="text-lg font-semibold">
                        {{ previewName }}
                      </h4>
                      <p class="text-sm leading-6 opacity-80">
                        Menú claro, visual rápido y una presencia que se siente propia.
                      </p>
                    </div>

                    <span
                      class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                      :style="{ backgroundColor: `${primaryMeta.swatch}22`, color: primaryMeta.swatch }"
                    >
                      {{ modelValue.colorMode }}
                    </span>
                  </div>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div
                    class="rounded-2xl border p-3"
                    :style="{ borderRadius: `${modelValue.radius}rem`, borderColor: `${neutralMeta.swatch}40` }"
                  >
                    <p class="text-xs font-semibold uppercase tracking-[0.14em] opacity-60">
                      Fuente
                    </p>
                    <p class="mt-2 text-sm font-medium">
                      {{ fontMeta.label }}
                    </p>
                  </div>

                  <div
                    class="rounded-2xl border p-3"
                    :style="{ borderRadius: `${modelValue.radius}rem`, borderColor: `${neutralMeta.swatch}40` }"
                  >
                    <p class="text-xs font-semibold uppercase tracking-[0.14em] opacity-60">
                      Iconos
                    </p>
                    <div class="mt-2 flex items-center gap-2 text-sm font-medium">
                      <UIcon :name="iconMeta.icon" class="size-4" />
                      <span>{{ iconMeta.label }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  <span
                    class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                    :style="{ backgroundColor: `${primaryMeta.swatch}18`, color: primaryMeta.swatch }"
                  >
                    Reserva
                  </span>
                  <span
                    class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                    :style="{ backgroundColor: `${neutralMeta.swatch}18`, color: neutralMeta.swatch }"
                  >
                    Menú del día
                  </span>
                </div>

                <div class="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div
                    class="rounded-2xl border px-4 py-3 text-sm"
                    :style="{ borderRadius: `${modelValue.radius}rem`, borderColor: `${neutralMeta.swatch}45` }"
                  >
                    Elige un plato y comparte el menú en segundos.
                  </div>

                  <UButton
                    color="neutral"
                    class="justify-center text-white"
                    :style="previewButtonStyle"
                    type="button"
                    variant="solid"
                  >
                    Ver menú
                  </UButton>
                </div>
              </div>
            </div>

            <p class="text-xs leading-5 text-muted">
              Esta vista previa te ayuda a definir la configuración visual que quedará guardada para este restaurante.
            </p>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
