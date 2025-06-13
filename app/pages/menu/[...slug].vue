<script setup lang="ts">
const { params } = useRoute();
const slug = params.slug as string;

const { getCurrentCategory } = useMenu();
const currentCategory = await getCurrentCategory(slug[0]!);

const columns = ref(1);

const title = ref('Bodega, Sushi and Loft -' + currentCategory?.title);

useHead({
  title: title.value,
  meta: [
    {
      name: 'description',
      content: currentCategory?.description || 'Descubre nuestros platillos y bebidas.',
    },
  ],
});

useSeoMeta({
  ogImage: 'https://res.cloudinary.com/rafamed-dev/image/upload/v1749410800/fudihub/maincover_h2tw7a.jpg',
});
</script>

<template>
  <main>
    <section class="py-4">
      <CategoryItem :slug="currentCategory?.slug" :cover="currentCategory?.cover" disabled />
    </section>

    <section class="relative">
      <section class="pb-16 md:grid md:grid-cols-2 md:gap-8">
        <!-- <div> -->
        <div v-for="section in currentCategory?.sections" :key="section.title">
          <SectionBanner :section="section" />
          <SectionItems :items="section.items" :columns="columns" />
        </div>
      </section>

      <ScrollToTop back-link="/menu" />
    </section>
  </main>
</template>
