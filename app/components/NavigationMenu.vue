<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

interface NavigationMenuProps {
  orientation?: 'horizontal' | 'vertical';
}

const { orientation = 'horizontal' } = defineProps<NavigationMenuProps>();

const items = ref<NavigationMenuItem[][]>([
  [
    {
      label: 'Menu',
      icon: 'i-simple-icons-github',
      to: 'https://github.com/nuxt/ui',
    },
    {
      label: 'Eventos',
      icon: 'i-lucide-circle-help',
      disabled: true,
    },
    {
      label: 'Acerca de',
      icon: 'i-lucide-circle-help',
      disabled: true,
    },
  ],
]);
</script>

<template>
  <UNavigationMenu
    :orientation
    :items
    class="[&>div]:min-w-full"
    :ui="{ list: 'min-w-full justify-between', link: 'flex-col basis-1/3' }"
  />
</template>
