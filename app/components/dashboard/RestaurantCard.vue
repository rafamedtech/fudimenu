<script setup lang="ts">
import type { DashboardRestaurant } from '~~/types/domain'

const props = defineProps<{
  restaurant: DashboardRestaurant
}>()

const locationBadges = computed(() =>
  [props.restaurant.city, props.restaurant.zone, props.restaurant.cuisineType].filter(
    (value): value is string => Boolean(value)
  )
)

const updatedAtLabel = computed(() => {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium'
  }).format(new Date(props.restaurant.updatedAt))
})
</script>

<template>
  <UiCard class="h-full" padding="md">
    <div class="flex h-full flex-col gap-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex flex-wrap gap-2">
          <UiBadge tone="neutral">
            {{ restaurant.membershipRole }}
          </UiBadge>

          <UiBadge :tone="restaurant.isPublished ? 'live' : 'draft'">
            {{ restaurant.isPublished ? 'Publicado' : 'Borrador' }}
          </UiBadge>
        </div>

        <p class="text-xs text-muted">
          Actualizado {{ updatedAtLabel }}
        </p>
      </div>

      <div class="space-y-2">
        <h2 class="text-lg font-semibold text-highlighted">
          {{ restaurant.name }}
        </h2>

        <p class="text-sm leading-6 text-muted">
          {{ restaurant.description || 'Completa la descripción para que la página pública se entienda rápido.' }}
        </p>
      </div>

      <div v-if="locationBadges.length" class="flex flex-wrap gap-2">
        <UiBadge
          v-for="badge in locationBadges"
          :key="badge"
          tone="primary"
        >
          {{ badge }}
        </UiBadge>
      </div>

      <div class="mt-auto flex flex-wrap gap-2">
        <UiButton
          :to="`/dashboard/restaurants/${restaurant.id}`"
          intent="neutral"
        >
          Editar perfil
        </UiButton>

        <UiButton :to="`/dashboard/restaurants/${restaurant.id}/menu`">
          Ir al menú
        </UiButton>
      </div>
    </div>
  </UiCard>
</template>
