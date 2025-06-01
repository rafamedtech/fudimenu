<script setup lang="ts">
const showEvent = ref(true);

const discardModal = () => {
  showEvent.value = false;
};

// const goToEvents = () => {
//   eventModal.value = false;
//   return navigateTo("/eventos");
// };
</script>

<template>
  <UModal
    title="Evento destacado"
    :open="showEvent"
    :close="{
      color: 'primary',
      variant: 'outline',
      class: 'rounded-full',
      label: 'Cerrar',
      onClick: discardModal,
    }"
  >
    <template #body>
      <img :src="featuredEventImage" alt="" class="mx-auto w-80 rounded-xl" />

      <section class="flex items-center justify-center mt-4">
        <UButton label="Ver eventos" trailing-icon="i-heroicons-calendar-days-solid" />
      </section>
    </template>
  </UModal>
</template>
