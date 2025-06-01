<script setup lang="ts">
interface AppHeadingProps {
  title?: string;
  description?: string;
}

defineProps<AppHeadingProps>();
</script>

<template>
  <section class="w-fit py-4">
    <h1 class="card-title text-primary-500 w-fit text-3xl font-bold md:text-4xl">
      {{ title }}
    </h1>
    <span class="dark:text-base-100">{{ description }}</span>
  </section>
</template>
