<script setup lang="ts">
const props = defineProps<{
  restaurantId: string
  restaurantSlug: string
  restaurantName: string
}>()

const route = useRoute()

const profilePath = computed(() => `/dashboard/restaurants/${props.restaurantId}`)
const menuPath = computed(() => `/dashboard/restaurants/${props.restaurantId}/menu`)

function isActiveLink(path: string) {
  return route.path === path
}
</script>

<template>
  <UiCard padding="md">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="space-y-2">
        <p class="eyebrow">Navegación del restaurante</p>
        <h2 class="text-lg font-semibold text-highlighted">
          {{ restaurantName }}
        </h2>
        <p class="text-sm leading-6 text-muted">
          Cambia entre el perfil del restaurante y la captura del menú sin salir del dashboard.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UiButton intent="ghost" to="/dashboard/restaurants">
          Todos tus restaurantes
        </UiButton>

        <UiButton
          :to="profilePath"
          :intent="isActiveLink(profilePath) ? 'primary' : 'neutral'"
        >
          Perfil
        </UiButton>

        <UiButton
          :to="menuPath"
          :intent="isActiveLink(menuPath) ? 'primary' : 'neutral'"
        >
          Menú
        </UiButton>

        <UiButton :to="`/r/${restaurantSlug}`" intent="ghost" target="_blank">
          Ver público
        </UiButton>
      </div>
    </div>
  </UiCard>
</template>
