<script setup lang="ts">
// import type { NavigationMenuItem } from '@nuxt/ui';

// const { items } = defineProps<{
//   items: NavigationMenuItem[] | NavigationMenuItem[][];
// }>();
import type { NavigationMenuItem } from '@nuxt/ui';

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Inicio',
    icon: 'i-lucide-house',
    to: '/',
  },
  {
    label: 'Menú',
    icon: 'i-lucide-book-open-text',
    to: '/menu',
  },
  {
    label: 'Eventos',
    icon: 'i-lucide-calendar-range',
    to: '/eventos',
  },
  {
    label: 'Encuesta',
    icon: 'i-lucide-book-heart',
    to: '/encuesta',
  },
]);
</script>

<template>
  <section class="fixed w-full bottom-0 z-[99] p-2">
    <section class="bg-white dark:bg-neutral-950 shadow rounded-lg">
      <UNavigationMenu
        :items="items"
        variant="link"
        :ui="{
          root: '[&>div]:w-full [&>div>ul]:justify-between',
          link: 'flex-col',
          linkLeadingIcon: 'text-2xl',
          item: 'basis-1/4',
        }"
      />
    </section>
  </section>
</template>
