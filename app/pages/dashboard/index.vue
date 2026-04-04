<script setup lang="ts">
const { appUser } = useAuthUser()
const { restaurants, pending, error } = useOwnerRestaurants()

const publishedCount = computed(() => restaurants.value.filter((restaurant) => restaurant.isPublished).length)
const draftCount = computed(() => restaurants.value.length - publishedCount.value)
const previewRestaurants = computed(() => restaurants.value.slice(0, 3))

definePageMeta({
  layout: 'dashboard'
})

useSeoMeta({
  title: 'Dashboard',
  description: 'Resumen de restaurantes y acceso rápido a la gestión del menú.'
})
</script>

<template>
  <DashboardPagePanel
    description="Resumen de restaurantes y acceso rápido a la gestión del menú."
    title="Dashboard"
  >
    <template #actions>
      <UiButton intent="neutral" size="sm" to="/dashboard/restaurants">
        Ver tus restaurantes
      </UiButton>
      <UiButton size="sm" to="/dashboard/restaurants/new">
        Crear restaurante
      </UiButton>
    </template>

    <div class="section-stack">
      <UiCard padding="lg">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <UiSectionHeader
            :title="`Hola, ${appUser?.fullName || 'restaurantero'}`"
            description="Este panel te deja entrar rápido a tus restaurantes, editar su perfil y capturar el menú sin perderte en pasos extra."
            eyebrow="Dashboard"
            title-tag="h1"
          />

          <div class="flex flex-wrap gap-3">
            <UiButton intent="neutral" to="/dashboard/restaurants">
              Ver tus restaurantes
            </UiButton>
            <UiButton to="/dashboard/restaurants/new">
              Crear restaurante
            </UiButton>
          </div>
        </div>
      </UiCard>

      <section class="grid gap-4 md:grid-cols-3">
        <UiCard padding="sm" surface="metric">
          <p class="metric-label">Tus restaurantes</p>
          <p class="metric-value">{{ restaurants.length }}</p>
          <p class="metric-hint">Acceso centralizado al perfil y menú.</p>
        </UiCard>

        <UiCard padding="sm" surface="metric">
          <p class="metric-label">Publicados</p>
          <p class="metric-value">{{ publishedCount }}</p>
          <p class="metric-hint">Visibles hoy en la parte pública.</p>
        </UiCard>

        <UiCard padding="sm" surface="metric">
          <p class="metric-label">Borradores</p>
          <p class="metric-value">{{ draftCount }}</p>
          <p class="metric-hint">Pendientes de completar o publicar.</p>
        </UiCard>
      </section>

      <UiCard padding="lg">
        <div class="section-stack">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <UiSectionHeader
              description="Entra directo al perfil o al menú del restaurante que quieras actualizar."
              eyebrow="Acceso rápido"
              title="Tus restaurantes"
            />

            <UiButton intent="neutral" to="/dashboard/restaurants">
              Ver listado completo
            </UiButton>
          </div>

          <div v-if="pending" class="empty-state">
            Cargando tus restaurantes...
          </div>

          <div v-else-if="error" class="feedback feedback--error">
            No pudimos cargar tus restaurantes.
          </div>

          <div v-else-if="!restaurants.length" class="empty-state">
            Aún no administras restaurantes. Crea el primero para empezar.
          </div>

          <div v-else class="grid gap-4 xl:grid-cols-3">
            <DashboardRestaurantCard
              v-for="restaurant in previewRestaurants"
              :key="restaurant.id"
              :restaurant="restaurant"
            />
          </div>
        </div>
      </UiCard>
    </div>
  </DashboardPagePanel>
</template>
