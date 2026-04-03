<script setup lang="ts">
defineOptions({
  inheritAttrs: false
})

type CardSurface = 'default' | 'metric' | 'soft'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    surface?: CardSurface
    padding?: CardPadding
    bodyClass?: string
    headerClass?: string
    footerClass?: string
  }>(),
  {
    surface: 'default',
    padding: 'md',
    bodyClass: '',
    headerClass: '',
    footerClass: ''
  }
)

const attrs = useAttrs()

const paddingMap: Record<CardPadding, string> = {
  none: 'p-0 sm:p-0',
  sm: 'p-4 sm:p-5',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8'
}

const surfaceClass = computed(() => {
  if (props.surface === 'metric') {
    return 'metric-card'
  }

  if (props.surface === 'soft') {
    return 'ui-card ui-card--soft'
  }

  return 'ui-card'
})

const resolvedUi = computed(() => ({
  body: [paddingMap[props.padding], props.bodyClass].filter(Boolean).join(' '),
  header: [paddingMap[props.padding], props.headerClass].filter(Boolean).join(' '),
  footer: [paddingMap[props.padding], props.footerClass].filter(Boolean).join(' ')
}))
</script>

<template>
  <UCard
    v-bind="attrs"
    :class="surfaceClass"
    :ui="resolvedUi"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <slot />

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UCard>
</template>
