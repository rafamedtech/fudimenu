<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    hint?: string
    required?: boolean
    forId?: string
    hintId?: string
  }>(),
  {
    label: '',
    hint: '',
    required: false,
    forId: '',
    hintId: ''
  }
)
</script>

<template>
  <div class="field ui-field">
    <div v-if="label" class="ui-field__header">
      <label class="field__label" :for="forId || undefined">{{ label }}</label>
      <span v-if="required" class="ui-field__required">*</span>
    </div>

    <slot />

    <p v-if="hint" :id="hintId || undefined" class="field__hint">
      {{ hint }}
    </p>
  </div>
</template>
