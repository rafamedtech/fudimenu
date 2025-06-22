<script setup lang="ts">
import type { Evento } from '@/types';

defineProps<{
  events: Evento[];
}>();

const emit = defineEmits<{ close: [boolean] }>();
</script>

<template>
  <UModal :close="{ onClick: () => emit('close', false) }" :title="events.length > 1 ? 'Events' : 'Event Details'">
    <template #footer>
      <div class="flex gap-2">
        <UButton color="neutral" label="Dismiss" @click="emit('close', false)" />
        <UButton label="Success" @click="emit('close', true)" />
      </div>
    </template>
  </UModal>
</template>
