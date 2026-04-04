<script setup lang="ts">
import type {
  DashboardCategoriesResponse,
  DashboardItemsResponse,
  DashboardRestaurantResponse
} from '~~/types/api'
import type { DashboardMenuCategory, DashboardMenuItem } from '~~/types/domain'

const route = useRoute()
const { appIcons } = useSiteTheme()

definePageMeta({
  layout: 'dashboard',
  middleware: ['restaurant-access']
})

const restaurantRequest = await useFetch<DashboardRestaurantResponse>(
  () => `/api/dashboard/restaurants/${route.params.id}`
)

if (restaurantRequest.error.value) {
  throw createError({
    statusCode: restaurantRequest.error.value.statusCode || 404,
    statusMessage: restaurantRequest.error.value.statusMessage || 'Restaurant not found'
  })
}

const categoriesRequest = await useFetch<DashboardCategoriesResponse>(
  () => `/api/dashboard/restaurants/${route.params.id}/categories`,
  {
    default: () => ({ categories: [] })
  }
)

const itemsRequest = await useFetch<DashboardItemsResponse>(
  () => `/api/dashboard/restaurants/${route.params.id}/items`,
  {
    default: () => ({ items: [] })
  }
)

const restaurant = computed(() => restaurantRequest.data.value!.restaurant)
const categories = computed(() => categoriesRequest.data.value?.categories ?? [])
const items = computed(() => itemsRequest.data.value?.items ?? [])

useSeoMeta({
  title: () => `Menú de ${restaurant.value.name}`,
  description: () => `Gestiona categorías y platillos del restaurante ${restaurant.value.name}.`
})

async function handleCategoriesUpdated(nextCategories: DashboardMenuCategory[]) {
  categoriesRequest.data.value = {
    categories: nextCategories
  }

  await itemsRequest.refresh()
}

function handleItemsUpdated(nextItems: DashboardMenuItem[]) {
  itemsRequest.data.value = {
    items: nextItems
  }

  categoriesRequest.refresh().catch(() => undefined)
}
</script>

<template>
  <DashboardPagePanel
    :description="`Gestiona categorías y platillos del restaurante ${restaurant.name}.`"
    :title="`Menú de ${restaurant.name}`"
  >
    <template #actions>
      <UiButton
        :to="`/dashboard/restaurants/${restaurant.id}`"
        :icon="appIcons.back"
        intent="neutral"
        size="sm"
      >
        Volver al perfil
      </UiButton>
    </template>

    <div class="section-stack">
      <DashboardRestaurantWorkspaceNav
        :restaurant-id="restaurant.id"
        :restaurant-name="restaurant.name"
        :restaurant-slug="restaurant.slug"
      />

      <UiCard padding="lg">
        <div class="page-header">
          <UiSectionHeader
            :title="restaurant.name"
            description="Organiza categorías, agrega platillos y controla qué se ve en la página pública."
            eyebrow="Menú"
            title-tag="h1"
          />

          <div class="button-row">
            <UiButton
              :to="`/dashboard/restaurants/${restaurant.id}`"
              :icon="appIcons.back"
              intent="neutral"
              variant="outline"
            >
              Volver al perfil
            </UiButton>
            <UiButton :to="`/r/${restaurant.slug}`" :icon="appIcons.external" target="_blank">
              Ver público
            </UiButton>
          </div>
        </div>
      </UiCard>

      <DashboardCategoryManager
        :categories="categories"
        :restaurant-id="restaurant.id"
        @updated="handleCategoriesUpdated"
      />

      <DashboardMenuItemManager
        :categories="categories"
        :items="items"
        :restaurant-id="restaurant.id"
        @updated="handleItemsUpdated"
      />
    </div>
  </DashboardPagePanel>
</template>
