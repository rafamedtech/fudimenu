<script setup lang="ts">
const { getMenu } = useMenu();

const menu = await getMenu();

useSeoMeta({
  title: 'Bodega, Sushi and loft',
  description: 'Conoce nuestros deliciosos platillos y mixología.',
  ogImage: 'https://res.cloudinary.com/rafamed-dev/image/upload/v1749410800/fudihub/maincover_h2tw7a.jpg',
});
</script>

<template>
  <section>
    <AppHeading title="Menú" description="Descubre nuestros platillos y bebidas." />
    <section class="grid gap-6 md:gap-8 md:px-2 md:pt-4 xl:grid-cols-2">
      <CategoryItem v-for="category in menu" :key="category.slug" :slug="category.slug" :cover="category.cover" />
    </section>
  </section>
</template>
