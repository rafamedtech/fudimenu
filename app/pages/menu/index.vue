<script setup lang="ts">
const { getMenu } = useMenu();

const menu = await getMenu();

useSeoMeta({
  title: 'Brunette Kitchen & Drinks | Menú 📖',
  description: 'Conoce nuestros deliciosos platillos y mixología.',
  ogImage: 'https://res.cloudinary.com/rafamed-dev/image/upload/v1705703429/menu/OG_Image_cl4k6w.png',
});
</script>

<template>
  <section>
    <AppHeading title="Menú" description="Descubre nuestros platillos y bebidas." />
    <section class="grid gap-6 md:gap-8 md:px-2 md:pt-4 xl:grid-cols-2">
      <CategoryItem v-for="category in menu" :key="category.slug" :category="category" />
    </section>
  </section>
</template>
