<script setup lang="ts">
// import type { NavLink } from '@/types';
import type { NavigationMenuItem } from '@nuxt/ui';

const { items } = defineProps<{
  items: NavigationMenuItem[] | NavigationMenuItem[][];
}>();
</script>

<template>
  <section class="fixed min-h-screen w-1/6 bg-primary-500 px-4">
    <article class="flex min-w-0 justify-center py-4">
      <AppLogo />
    </article>
    <ClientOnly>
      <UNavigationMenu :items="items" orientation="vertical" class="data-[orientation=vertical]:w-48" />
    </ClientOnly>
  </section>
</template>
