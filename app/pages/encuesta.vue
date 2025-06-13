<script setup lang="ts">
// const store = useStore();
// const { isLoading } = storeToRefs(store);

// const { surveyPageLabels } = useI18n();

// const { getQuestions } = useSurvey();
// await getQuestions();

// useHead({
//   title: surveyPageLabels.value.title,
//   meta: [
//     {
//       name: "description",
//       content: surveyPageLabels.value.description,
//     },
//   ],
// });
</script>

<template>
  <section>
    <AppHeading title="Encuesta de satisfacción" description="Ayúdanos a mejorar tu experiencia con tus comentarios." />

    <section>
      <SurveyForm />
    </section>
  </section>
</template>
