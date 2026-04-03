<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    hint?: string
    required?: boolean
  }>(),
  {
    label: '',
    hint: '',
    required: false
  }
)
</script>

<template>
  <div class="field ui-field">
    <div v-if="label" class="ui-field__header">
      <span class="field__label">{{ label }}</span>
      <span v-if="required" class="ui-field__required">*</span>
    </div>

    <slot />

    <p v-if="hint" class="field__hint">
      {{ hint }}
    </p>
  </div>
</template>
