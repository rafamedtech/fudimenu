<script setup lang="ts">
defineOptions({
  inheritAttrs: false
})

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    label?: string
    hint?: string
    placeholder?: string
    type?: string
    autocomplete?: string
    required?: boolean
    disabled?: boolean
    icon?: string
    trailingIcon?: string
    inputmode?: string
    min?: string | number
    max?: string | number
    step?: string | number
    size?: 'sm' | 'md' | 'lg' | 'xl'
    number?: boolean
  }>(),
  {
    modelValue: '',
    label: '',
    hint: '',
    placeholder: '',
    type: 'text',
    autocomplete: undefined,
    required: false,
    disabled: false,
    icon: undefined,
    trailingIcon: undefined,
    inputmode: undefined,
    min: undefined,
    max: undefined,
    step: undefined,
    size: 'lg',
    number: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const attrs = useAttrs()
const generatedId = useId()
const inputId = computed(() => String(attrs.id ?? generatedId))
const hintId = computed(() => (props.hint ? `${inputId.value}-hint` : undefined))

function handleUpdate(value: string | number) {
  if (!props.number) {
    emit('update:modelValue', value)
    return
  }

  if (value === '' || value === null || value === undefined) {
    emit('update:modelValue', '')
    return
  }

  emit('update:modelValue', Number(value))
}
</script>

<template>
  <UiField
    :for-id="inputId"
    :hint="hint"
    :hint-id="hintId"
    :label="label"
    :required="required"
  >
    <UInput
      v-bind="attrs"
      :aria-describedby="hintId"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :id="inputId"
      :icon="icon"
      :inputmode="inputmode"
      :max="max"
      :min="min"
      :model-value="modelValue ?? ''"
      :placeholder="placeholder"
      :required="required"
      :size="size"
      :step="step"
      :trailing-icon="trailingIcon"
      :type="type"
      @update:model-value="handleUpdate"
    />
  </UiField>
</template>
