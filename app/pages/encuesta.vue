<script setup lang="ts">
useSeoMeta({
  title: 'Encuesta de satisfacción',
  description: 'Ayúdanos a mejorar tu experiencia con tus comentarios.',
  ogImage: 'https://res.cloudinary.com/rafamed-dev/image/upload/v1749410800/fudihub/maincover_h2tw7a.jpg',
});
</script>

<template>
  <section>
    <AppHeading title="Encuesta de satisfacción" description="Ayúdanos a mejorar tu experiencia con tus comentarios." />

    <section>
      <SurveyForm />
    </section>
  </section>
</template>
