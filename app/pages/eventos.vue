<script setup lang="ts">
import type { Evento } from '@/types';
// import { EventModal } from "#components";
// import { allEvents } from "@/sanity/queries";

// const modal = useModal();
// const store = useStore();

// const { data: events } = useSanityQuery<Evento[]>(allEvents);
// const { eventsPageLabels } = useI18n();
const events = ref<Evento[]>([]); // Replace with actual data fetching logic

// const openDetails = (event: Evento) => modal.open(EventModal, { event });
// const openGallery = (events: Evento[] | null) =>
//   modal.open(EventModal, { events });

// useHead({
//   title: eventsPageLabels.value.title,
//   meta: [
//     {
//       name: "description",
//       content: eventsPageLabels.value.description,
//     },
//   ],
// });
</script>

<template>
  <section>
    <AppHeading title="Eventos y promociones" description="Descubre nuestros eventos y promociones especiales." />

    <!-- Events on mobile -->
    <section class="flex flex-col gap-8 px-4">
      <UButton label="Pantalla completa" icon="i-heroicons-arrows-pointing-out" class="mx-auto" />
      <!-- @click="openGallery(events)" -->

      <section class="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        <UCard v-for="event in events" :key="event.id" class="rounded-xl" :ui="{ body: 'p-0 sm:p-0' }">
          <!-- @click="openDetails(event)" -->
          <img
            :src="event.cover"
            :alt="event.name"
            class="h-64 w-full cursor-pointer rounded-xl object-cover md:h-full"
          />
        </UCard>
      </section>
    </section>
  </section>
</template>
