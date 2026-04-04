<script setup lang="ts">
import { extractErrorMessage } from '~~/lib/errors'
import type { DashboardRestaurantResponse } from '~~/types/api'
import type { DashboardRestaurantPayload, DashboardRestaurantSubmitAction } from '~~/types/domain'

definePageMeta({
  layout: 'dashboard'
})

useSeoMeta({
  title: 'Nuevo restaurante',
  description: 'Crea un restaurante y deja listo su perfil público básico.'
})

const pending = ref(false)
const errorMessage = ref<string | null>(null)

async function handleCreate(payload: DashboardRestaurantPayload, _action: DashboardRestaurantSubmitAction) {
  pending.value = true
  errorMessage.value = null

  try {
    const response = await $fetch<DashboardRestaurantResponse>('/api/dashboard/restaurants', {
      method: 'POST',
      body: payload
    })

    await navigateTo(`/dashboard/restaurants/${response.restaurant.id}`)
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'No pudimos crear el restaurante.')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <DashboardPagePanel
    description="Crea un restaurante y deja listo su perfil público básico."
    title="Nuevo restaurante"
  >
    <template #actions>
      <UiButton intent="neutral" size="sm" to="/dashboard/restaurants">
        Volver al listado
      </UiButton>
    </template>

    <DashboardRestaurantForm
      :error-message="errorMessage"
      :pending="pending"
      @submit="handleCreate"
    />
  </DashboardPagePanel>
</template>
