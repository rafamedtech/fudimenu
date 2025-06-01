<script setup lang="ts">
import { restInfo } from '@/utils/restInfo';

const { logo, brandImage } = restInfo;
</script>

<template>
  <div class="flex items-center gap-2 rounded-lg">
    <img :src="logo" alt="Restaurant logo" class="w-20" />
    <img :src="brandImage" alt="Restaurant name" class="w-24 invert-0 dark:invert-100" />
  </div>
</template>
