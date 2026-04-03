<script setup lang="ts">
useSiteThemeSync()
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator color="var(--color-primary)" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
