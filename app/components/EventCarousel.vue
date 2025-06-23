<script setup lang="ts">
import type { Evento } from '@/types';

interface CarouselItems {
  items: Evento[];
}

defineProps<CarouselItems>();
</script>

<template>
  <UCarousel v-slot="{ item }" :items="items" class="w-full max-w-xs mx-auto">
    <img :src="item?.cover" width="320" height="320" class="rounded-lg" />
  </UCarousel>
</template>
