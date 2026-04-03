<script setup lang="ts">
const { appIcons } = useSiteTheme()

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    label: string
    description?: string
    disabled?: boolean
  }>(),
  {
    modelValue: false,
    description: '',
    disabled: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function handleChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <label class="ui-checkbox" :class="{ 'ui-checkbox--disabled': disabled }">
    <input
      :checked="modelValue"
      :disabled="disabled"
      class="ui-checkbox__native"
      type="checkbox"
      @change="handleChange"
    >

    <span class="ui-checkbox__box" aria-hidden="true">
      <UIcon v-if="modelValue" :name="appIcons.check ?? 'i-lucide-check'" class="size-3.5" />
    </span>

    <span class="ui-checkbox__content">
      <span class="ui-checkbox__label">{{ label }}</span>
      <span v-if="description" class="ui-checkbox__description">{{ description }}</span>
    </span>
  </label>
</template>
