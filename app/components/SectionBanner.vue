<script setup lang="ts">
import type { Section } from '@/types';
import { restInfo } from '@/utils/restInfo';

const { logo } = restInfo;

const { section } = defineProps<{
  section: Section;
}>();
</script>

<template>
  <UCard
    class="relative flex h-32 w-full flex-col justify-center rounded-xl py-2 shadow-pinterest lg:h-40 lg:shadow-xl"
  >
    <img
      :src="section.cover || logo"
      alt=""
      class="absolute inset-0 h-full w-full rounded-xl object-cover dark:brightness-50"
    />

    <h2
      class="font-handlee font-bold relative z-50 text-center text-2xl"
      :class="{
        'text-dark-strong dark:text-gray-100': !section.cover,
        'text-gray-100': section.cover,
      }"
    >
      {{ section.title }}
    </h2>
    <p class="font-handlee z-10 text-center text-lg font-extralight text-gray-50" v-if="section.description">
      {{ section.description }}
    </p>
  </UCard>
</template>
