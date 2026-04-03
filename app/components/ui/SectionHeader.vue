<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    description?: string
    titleTag?: 'h1' | 'h2' | 'h3'
  }>(),
  {
    eyebrow: '',
    description: '',
    titleTag: 'h2'
  }
)
</script>

<template>
  <div class="ui-section-header">
    <div class="section-stack">
      <p v-if="eyebrow" class="eyebrow">
        {{ eyebrow }}
      </p>

      <component :is="titleTag" class="section-heading">
        {{ title }}
      </component>

      <p v-if="description" class="section-copy">
        {{ description }}
      </p>
    </div>

    <div v-if="$slots.actions" class="ui-section-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>
