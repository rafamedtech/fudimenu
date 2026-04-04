<script setup lang="ts">
import { extractErrorMessage } from '~~/lib/errors'
import type { DashboardRestaurantResponse } from '~~/types/api'
import type { DashboardRestaurantPayload, DashboardRestaurantSubmitAction } from '~~/types/domain'

const route = useRoute()
const { appIcons } = useSiteTheme()

definePageMeta({
  layout: 'dashboard',
  middleware: ['restaurant-access']
})

const { data, error } = await useFetch<DashboardRestaurantResponse>(
  () => `/api/dashboard/restaurants/${route.params.id}`
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Restaurant not found'
  })
}

const pending = ref(false)
const saveMessage = ref<string | null>(null)
const saveError = ref<string | null>(null)

const restaurant = computed(() => data.value!.restaurant)

useSeoMeta({
  title: () => `Editar ${restaurant.value.name}`,
  description: () => `Edita el perfil privado de ${restaurant.value.name} en FudiMenu.`
})

async function handleUpdate(payload: DashboardRestaurantPayload, action: DashboardRestaurantSubmitAction) {
  pending.value = true
  saveMessage.value = null
  saveError.value = null

  try {
    const response = await $fetch<DashboardRestaurantResponse>(
      `/api/dashboard/restaurants/${restaurant.value.id}`,
      {
        method: 'PATCH',
        body: payload
      }
    )

    data.value = response
    saveMessage.value =
      action === 'draft' || !response.restaurant.isPublished
        ? 'Restaurante guardado como borrador.'
        : 'Restaurante publicado y actualizado.'
  } catch (error) {
    saveError.value = extractErrorMessage(error, 'No pudimos guardar los cambios.')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <DashboardPagePanel
    :description="`Edita el perfil privado de ${restaurant.name} en FudiMenu.`"
    :title="restaurant.name"
  >
    <template #actions>
      <UiButton
        :to="`/dashboard/restaurants/${restaurant.id}/menu`"
        :icon="appIcons.utensils"
        size="sm"
      >
        Abrir menú
      </UiButton>
    </template>

    <div class="section-stack">
      <div v-if="saveMessage" class="feedback feedback--success">
        {{ saveMessage }}
      </div>

      <DashboardRestaurantWorkspaceNav
        :restaurant-id="restaurant.id"
        :restaurant-name="restaurant.name"
        :restaurant-slug="restaurant.slug"
      />

      <DashboardRestaurantForm
        :error-message="saveError"
        :pending="pending"
        :restaurant="restaurant"
        @submit="handleUpdate"
      />

      <section class="panel">
        <div class="page-header">
          <UiSectionHeader
            description="Una vez listo el perfil, entra a la sección de menú para capturar categorías y platillos."
            eyebrow="Siguiente paso"
            title="Gestiona categorías y platillos"
          />

          <div class="button-row">
            <UiButton
              :to="`/r/${restaurant.slug}`"
              :icon="appIcons.external"
              intent="neutral"
              target="_blank"
            >
              Ver página pública
            </UiButton>
            <UiButton :to="`/dashboard/restaurants/${restaurant.id}/menu`" :icon="appIcons.utensils">
              Abrir menú
            </UiButton>
          </div>
        </div>
      </section>
    </div>
  </DashboardPagePanel>
</template>
