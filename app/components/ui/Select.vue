<script setup lang="ts">
type SelectValue = string | number

const props = withDefaults(
  defineProps<{
    modelValue?: SelectValue | null
    label?: string
    hint?: string
    required?: boolean
    disabled?: boolean
    placeholder?: string
    number?: boolean
    options: Array<{
      label: string
      value: SelectValue
      disabled?: boolean
    }>
  }>(),
  {
    modelValue: '',
    label: '',
    hint: '',
    required: false,
    disabled: false,
    placeholder: '',
    number: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: SelectValue]
}>()

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const nextValue = target.value

  if (!props.number) {
    emit('update:modelValue', nextValue)
    return
  }

  emit('update:modelValue', Number(nextValue))
}
</script>

<template>
  <UiField :hint="hint" :label="label" :required="required">
    <select
      :disabled="disabled"
      :required="required"
      :value="modelValue ?? ''"
      @change="handleChange"
    >
      <option v-if="placeholder" disabled value="">
        {{ placeholder }}
      </option>

      <option
        v-for="option in options"
        :key="`${option.value}`"
        :disabled="option.disabled"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </UiField>
</template>
