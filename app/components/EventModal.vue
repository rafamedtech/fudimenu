<script setup lang="ts">
import type { Evento } from '@/types';

defineProps<{
  events: Evento[];
}>();

const emit = defineEmits<{ close: [boolean] }>();
</script>

<template>
  <UModal
    :close="{ onClick: () => emit('close', false) }"
    :title="events.length > 1 ? 'Galería de eventos' : 'Detalles del evento'"
    :description="events.length > 1 ? 'Desliza para ver más eventos' : ' '"
  >
    <template #body>
      <EventCarousel :items="events" />
    </template>
  </UModal>
</template>
