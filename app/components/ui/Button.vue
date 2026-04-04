<script setup lang="ts">
defineOptions({
  inheritAttrs: false
})

type ButtonIntent =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'ghost'
  | 'soft'
  | 'success'
  | 'danger'

type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'soft' | 'subtle' | 'link'
type ButtonColor = 'primary' | 'secondary' | 'neutral' | 'success' | 'error'

const props = withDefaults(
  defineProps<{
    intent?: ButtonIntent
    color?: ButtonColor
    variant?: ButtonVariant
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    icon?: string
    trailing?: boolean
    block?: boolean
    to?: string | Record<string, unknown>
    href?: string
    target?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
  }>(),
  {
    intent: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
    trailing: false,
    block: false
  }
)

const attrs = useAttrs()

const intentMap: Record<ButtonIntent, { color: ButtonColor, variant: ButtonVariant, class: string }> = {
  primary: {
    color: 'primary',
    variant: 'solid',
    class: ''
  },
  secondary: {
    color: 'secondary',
    variant: 'soft',
    class: 'text-[color:var(--color-accent)]'
  },
  neutral: {
    color: 'neutral',
    variant: 'outline',
    class: ''
  },
  ghost: {
    color: 'neutral',
    variant: 'ghost',
    class: ''
  },
  soft: {
    color: 'primary',
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
  }
}

const preset = computed(() => intentMap[props.intent])
const resolvedColor = computed(() => props.color ?? preset.value.color)
const resolvedVariant = computed(() => props.variant ?? preset.value.variant)
const contrastClass = computed(() => {
  const customContrastVariants: ButtonVariant[] = ['solid', 'soft', 'subtle']

  if (resolvedColor.value !== 'primary' || !customContrastVariants.includes(resolvedVariant.value)) {
    return ''
  }

  return '!text-white dark:!text-black [&_svg]:!text-white dark:[&_svg]:!text-black'
})

const resolvedClass = computed(() => [
  'ui-button',
  `ui-button--${props.intent}`,
  props.block ? 'w-full justify-center' : '',
  preset.value.class,
  contrastClass.value
].filter(Boolean).join(' '))
</script>

<template>
  <UButton
    v-bind="attrs"
    :block="block"
    :class="resolvedClass"
    :color="resolvedColor"
    :disabled="disabled"
    :href="href"
    :icon="icon"
    :loading="loading"
    :size="size"
    :target="target"
    :to="to"
    :trailing="trailing"
    :type="type"
    :variant="resolvedVariant"
  >
    <slot />
  </UButton>
</template>
