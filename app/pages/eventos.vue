<script setup lang="ts">
import type { Evento } from '@/types';
import { EventModal } from '#components';

const { getEvents } = useEvent();

const events = await getEvents();

const overlay = useOverlay();

async function open(events: Evento[]) {
  const modal = overlay.create(EventModal, {
    props: { events },
  });
  modal.open();
}

// const openDetails = (event: Evento) => {

// };
// const openGallery = (events: Evento[] | null) =>
//   modal.open(EventModal, { events });

useSeoMeta({
  title: 'Eventos y promociones',
  description: 'Descubre nuestros eventos y promociones especiales.',
  ogImage: 'https://res.cloudinary.com/rafamed-dev/image/upload/v1749410800/fudihub/maincover_h2tw7a.jpg',
});
</script>

<template>
  <section>
    <AppHeading title="Eventos y promociones" description="Descubre nuestros eventos y promociones especiales." />

    <section class="flex flex-col gap-8 px-4">
      <UButton label="Pantalla completa" icon="i-heroicons-arrows-pointing-out" class="mx-auto" @click="open(events)" />
      <!-- @click="openGallery(events)" -->

      <section class="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        <UCard
          v-for="event in events"
          :key="event.id"
          class="rounded-xl"
          :ui="{ body: 'p-0 sm:p-0' }"
          @click="open([event])"
        >
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
