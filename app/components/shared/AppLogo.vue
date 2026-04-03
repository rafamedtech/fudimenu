<script setup lang="ts">
withDefaults(
  defineProps<{
    caption?: string
  }>(),
  {
    caption: 'Descubre menús locales'
  }
)
</script>

<template>
  <NuxtLink class="brand-link" to="/">
    <span class="brand-mark">FM</span>

    <span class="brand-copy">
      <span class="brand-title">FudiMenu</span>
      <span class="brand-caption">{{ caption }}</span>
    </span>
  </NuxtLink>
</template>
