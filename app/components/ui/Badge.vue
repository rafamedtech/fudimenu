<script setup lang="ts">
type BadgeTone =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'success'
  | 'danger'
  | 'warm'
  | 'live'
  | 'draft'

type BadgeVariant = 'solid' | 'outline' | 'soft' | 'subtle'
type BadgeColor = 'primary' | 'secondary' | 'neutral' | 'success' | 'error'

const props = withDefaults(
  defineProps<{
    tone?: BadgeTone
    color?: BadgeColor
    variant?: BadgeVariant
    icon?: string
    dot?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    tone: 'neutral',
    size: 'md',
    dot: false
  }
)

const toneMap: Record<BadgeTone, { color: BadgeColor, variant: BadgeVariant, class: string }> = {
  primary: {
    color: 'primary',
    variant: 'soft',
    class: ''
  },
  secondary: {
    color: 'secondary',
    variant: 'soft',
    class: 'text-[color:var(--color-accent)]'
  },
  neutral: {
    color: 'neutral',
    variant: 'soft',
    class: ''
  },
  success: {
    color: 'success',
    variant: 'soft',
    class: ''
  },
  danger: {
    color: 'error',
    variant: 'soft',
    class: ''
  },
  warm: {
    color: 'primary',
    variant: 'soft',
    class: ''
  },
  live: {
    color: 'success',
    variant: 'soft',
    class: ''
  },
  draft: {
    color: 'neutral',
    variant: 'soft',
    class: 'text-muted'
  }
}

const preset = computed(() => toneMap[props.tone])
const resolvedColor = computed(() => props.color ?? preset.value.color)
const resolvedVariant = computed(() => props.variant ?? preset.value.variant)
const resolvedClass = computed(() => [
  'ui-badge',
  `ui-badge--${props.tone}`,
  preset.value.class
].filter(Boolean).join(' '))
</script>

<template>
  <UBadge
    :class="resolvedClass"
    :color="resolvedColor"
    :size="size"
    :variant="resolvedVariant"
  >
    <span v-if="dot" class="ui-badge__dot" />
    <UIcon v-if="icon" :name="icon" class="size-3.5" />
    <slot />
  </UBadge>
</template>
