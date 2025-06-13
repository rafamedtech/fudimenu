<script setup lang="ts">
const { backLink } = defineProps<{
  backLink: string;
}>();

const showScrollToTop = ref(false);

const handleScroll = () => {
  showScrollToTop.value = window.scrollY > 150;
};
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <section
    class="text-primary bg-primary fixed bottom-[6rem] right-4 z-[49] flex gap-2 flex-row rounded-xl shadow-md lg:bottom-8 lg:right-8"
  >
    <UButton
      v-if="showScrollToTop"
      label="Arriba"
      icon="i-heroicons-arrow-small-up"
      class="text-white"
      @click="scrollToTop"
      size="lg"
    />
    <UButton
      label="Regresar"
      icon="i-heroicons-arrow-small-left"
      class="text-white"
      size="lg"
      @click="navigateTo(backLink)"
    />
  </section>
</template>
