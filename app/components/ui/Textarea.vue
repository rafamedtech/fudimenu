<script setup lang="ts">
defineOptions({
  inheritAttrs: false
})

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    label?: string
    hint?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    autoresize?: boolean
    rows?: number
  }>(),
  {
    modelValue: '',
    label: '',
    hint: '',
    placeholder: '',
    required: false,
    disabled: false,
    autoresize: false,
    rows: 5
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const attrs = useAttrs()
</script>

<template>
  <UiField :hint="hint" :label="label" :required="required">
    <UTextarea
      v-bind="attrs"
      :autoresize="autoresize"
      :disabled="disabled"
      :model-value="modelValue ?? ''"
      :placeholder="placeholder"
      :required="required"
      :rows="rows"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </UiField>
</template>
