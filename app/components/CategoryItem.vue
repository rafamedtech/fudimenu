<script lang="ts" setup>
interface Props {
  slug?: string;
  cover?: string;
}

const { slug, cover } = defineProps<Props>();
</script>

<template>
  <NuxtLink :to="`/menu/${slug}`" class="w-full text-center xl:h-[300px]">
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <figure class="h-44 shadow-lg md:h-[25rem] lg:h-[300px]">
        <img :src="cover" class="h-full w-full rounded-lg object-cover object-center brightness-75" />
      </figure>
    </UCard>
  </NuxtLink>
</template>
