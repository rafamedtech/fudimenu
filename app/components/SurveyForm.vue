<script setup lang="ts">
// import { SurveyModal } from "#components";
// import { waitersList } from "@/utils/surveyInfo";
// import type { FormSubmitEvent } from "#ui/types";

const { surveyData, getQuestions, questions } = useSurvey();
await getQuestions();

// const modal = useModal();
const loadingBtn = ref(false);
async function onSubmit() {
  //   const survey = { ...event.data, questions: questions.value };

  loadingBtn.value = true;

  setTimeout(async () => {
    // await sendSurvey(survey);
    // await sendEmail();
    // modal.open(SurveyModal, {});
    loadingBtn.value = false;
  }, 500);
}

const ratings = [1, 2, 3, 4, 5];
</script>

<template>
  <UForm :state="surveyData" class="mx-auto max-w-md" @submit="onSubmit">
    <article class="flex flex-col items-stretch gap-4">
      <UFormField label="Nombre (Opcional)">
        <UInput size="xl" placeholder="Escribe aquí" v-model="surveyData.name" class="w-full" />
      </UFormField>
      <UFormField label="Teléfono (con WhatsApp)">
        <UInput size="xl" type="email" placeholder="ejemplo@correo.com" v-model="surveyData.email" class="w-full" />
      </UFormField>
      <UFormField label="Mesero que te atendió">
        <USelectMenu
          :items="['Rafael', 'Erik', 'Augusto']"
          size="xl"
          v-model="surveyData.waiter"
          :search-input="false"
          class="w-full"
        />
      </UFormField>
    </article>

    <section class="my-12 flex flex-col gap-4 border-t border-gray-300 dark:border-gray-600 pt-6">
      <article
        v-for="question in questions"
        :key="question.text"
        class="flex items-center gap-4 border-b border-gray-300 pb-6 dark:border-gray-600 md:flex-row md:items-center md:gap-2"
      >
        <h3 class="flex-1">{{ question.text }}</h3>
        <div class="flex items-center justify-center gap-2">
          <USelectMenu :items="ratings" size="xl" v-model="question.rating" :search-input="false" />
          <Icon name="i-heroicons-star" size="32" class="text-primary" />
        </div>
      </article>
    </section>

    <UFormField label="Comentarios">
      <UTextarea size="xl" placeholder="Escribe aquí tus comentarios" class="w-full" />
    </UFormField>

    <section class="mt-8 pb-28 flex justify-end">
      <UButton
        :loading="loadingBtn"
        size="lg"
        :label="loadingBtn ? 'Enviando...' : 'Enviar encuesta'"
        icon="i-heroicons-paper-airplane"
        type="submit"
      />
    </section>
  </UForm>
</template>
