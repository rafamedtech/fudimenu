<script setup lang="ts">
const { restaurants, pending, error, refresh } = useOwnerRestaurants()

const publishedCount = computed(() => restaurants.value.filter((restaurant) => restaurant.isPublished).length)
const draftCount = computed(() => restaurants.value.length - publishedCount.value)

definePageMeta({
  layout: 'dashboard'
})

useSeoMeta({
  title: 'Tus restaurantes',
  description: 'Gestiona todos los restaurantes a los que tienes acceso dentro de FudiMenu.'
})
</script>

<template>
  <div class="section-stack">
    <UiCard padding="lg">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <UiSectionHeader
          description="Este listado es tu punto de entrada para administrar perfil, visibilidad y menú."
          eyebrow="Restaurantes"
          title="Todos tus restaurantes"
          title-tag="h1"
        />

        <div class="flex flex-wrap gap-3">
          <UiButton intent="neutral" @click="refresh()">
            Recargar
          </UiButton>
          <UiButton to="/dashboard/restaurants/new">
            Crear restaurante
          </UiButton>
        </div>
      </div>
    </UiCard>

    <section class="grid gap-4 md:grid-cols-3">
      <UiCard padding="sm" surface="metric">
        <p class="metric-label">Total</p>
        <p class="metric-value">{{ restaurants.length }}</p>
        <p class="metric-hint">Restaurantes que puedes administrar.</p>
      </UiCard>

      <UiCard padding="sm" surface="metric">
        <p class="metric-label">Publicados</p>
        <p class="metric-value">{{ publishedCount }}</p>
        <p class="metric-hint">Con visibilidad pública activa.</p>
      </UiCard>

      <UiCard padding="sm" surface="metric">
        <p class="metric-label">Borradores</p>
        <p class="metric-value">{{ draftCount }}</p>
        <p class="metric-hint">Pendientes de completar o publicar.</p>
      </UiCard>
    </section>

    <div v-if="pending" class="empty-state">
      Cargando restaurantes...
    </div>

    <div v-else-if="error" class="feedback feedback--error">
      No pudimos cargar tus restaurantes.
    </div>

    <div v-else-if="!restaurants.length" class="panel empty-state">
      No administras restaurantes todavía.
    </div>

    <div v-else class="grid gap-4 xl:grid-cols-2">
      <DashboardRestaurantCard
        v-for="restaurant in restaurants"
        :key="restaurant.id"
        :restaurant="restaurant"
      />
    </div>
  </div>
</template>
