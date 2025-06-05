<script setup lang="ts">
import type { Category } from '@/types';
// const { params } = useRoute();
// const slug = params.slug;

const currentCategory = {} as Category;

// const columns = ref(1);

useHead({
  title: currentCategory.title,
  meta: [
    {
      name: 'description',
      content: currentCategory.description,
    },
  ],
});
</script>

<template>
  <main>
    <section class="pt-4">
      <CategoryItem :category="currentCategory" disabled />
    </section>

    <section class="relative">
      <section class="pb-16 md:grid md:grid-cols-2 md:gap-8">
        <!-- <div v-for="section in category?.sections" > -->
        <div>
          <!-- <SectionBanner :section="section" />
          <SectionItems :items="section.items" :columns="columns" /> -->
        </div>
      </section>

      <ScrollToTop back-link="/menu" />
    </section>
  </main>
</template>
