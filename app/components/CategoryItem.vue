<script lang="ts" setup>
import type { Category } from '@/types';

interface Props {
  category: Category;
}

const { category } = defineProps<Props>();
</script>

<template>
  <NuxtLink :to="`/menu/${category.slug}`" class="w-full text-center xl:h-[300px]">
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <figure class="h-44 shadow-lg md:h-[25rem] lg:h-[300px]">
        <img :src="category.cover" class="h-full w-full rounded-lg object-cover object-center brightness-75" />
        <!-- <img
          :src="category.cover"
          densities="x1 x2"
          format="webp"
          quality="80"
          preload
          loading="lazy"
          class="h-full w-full rounded-lg object-cover object-center brightness-75"
        /> -->
      </figure>
    </UCard>
  </NuxtLink>
</template>
