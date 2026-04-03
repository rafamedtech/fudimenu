<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  options: Array<{
    label: string
    value: string
  }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="auth-toggle">
    <button
      v-for="option in options"
      :key="option.value"
      class="auth-toggle__button"
      :class="{ 'is-active': modelValue === option.value }"
      type="button"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
