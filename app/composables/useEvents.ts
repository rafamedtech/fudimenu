import type { Evento } from '~/types';

export function useEvent() {
  const eventos = ref<Evento[]>([]);

  const getEvents = async () => {
    const newEvents = await $fetch('/api/events');
    eventos.value = newEvents as Evento[];
    return eventos;
  };

  return {
    getEvents,
  };
}
