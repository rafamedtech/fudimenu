<script setup lang="ts">
import { defaultRestaurantThemeConfig } from '~~/lib/restaurant-theme'
import type {
  DashboardRestaurant,
  DashboardRestaurantPayload,
  DashboardRestaurantSubmitAction
} from '~~/types/domain'

const props = withDefaults(
  defineProps<{
    restaurant?: Partial<DashboardRestaurant> | null
    pending?: boolean
    errorMessage?: string | null
  }>(),
  {
    restaurant: null,
    pending: false,
    errorMessage: null
  }
)

const emit = defineEmits<{
  submit: [payload: DashboardRestaurantPayload, action: DashboardRestaurantSubmitAction]
}>()

const defaults: DashboardRestaurantPayload = {
  name: '',
  slug: '',
  description: '',
  logoUrl: '',
  coverImageUrl: '',
  address: '',
  city: '',
  zone: '',
  phone: '',
  whatsapp: '',
  cuisineType: '',
  businessHours: '',
  isPublished: false,
  themeConfig: { ...defaultRestaurantThemeConfig }
}

const state = reactive<DashboardRestaurantPayload>({
  ...defaults,
  themeConfig: { ...defaultRestaurantThemeConfig }
})
const slugTouched = ref(false)
const submittedAction = ref<DashboardRestaurantSubmitAction>('publish')

function toSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function applyRestaurant(values?: Partial<DashboardRestaurant> | null) {
  Object.assign(state, defaults, {
    name: values?.name ?? '',
    slug: values?.slug ?? '',
    description: values?.description ?? '',
    logoUrl: values?.logoUrl ?? '',
    coverImageUrl: values?.coverImageUrl ?? '',
    address: values?.address ?? '',
    city: values?.city ?? '',
    zone: values?.zone ?? '',
    phone: values?.phone ?? '',
    whatsapp: values?.whatsapp ?? '',
    cuisineType: values?.cuisineType ?? '',
    businessHours: values?.businessHours ?? '',
    isPublished: values?.isPublished ?? false,
    themeConfig: {
      ...defaultRestaurantThemeConfig,
      ...values?.themeConfig
    }
  })

  slugTouched.value = Boolean(values?.slug)
}

watch(
  () => props.restaurant,
  (restaurant) => {
    applyRestaurant(restaurant)
  },
  {
    immediate: true,
    deep: true
  }
)

watch(
  () => state.name,
  (name) => {
    if (!slugTouched.value) {
      state.slug = toSlug(name)
    }
  }
)

const draftButtonLabel = computed(() =>
  props.restaurant?.isPublished ? 'Guardar como borrador' : 'Guardar borrador'
)

const publishButtonLabel = computed(() => {
  if (!props.restaurant?.id) {
    return 'Crear y publicar'
  }

  return props.restaurant.isPublished ? 'Guardar cambios' : 'Guardar y publicar'
})

function handleSubmit(action: DashboardRestaurantSubmitAction) {
  submittedAction.value = action

  emit('submit', {
    ...state,
    name: state.name.trim(),
    slug: toSlug(state.slug || state.name),
    description: state.description.trim(),
    logoUrl: state.logoUrl.trim(),
    coverImageUrl: state.coverImageUrl.trim(),
    address: state.address.trim(),
    city: state.city.trim(),
    zone: state.zone.trim(),
    phone: state.phone.trim(),
    whatsapp: state.whatsapp.trim(),
    cuisineType: state.cuisineType.trim(),
    businessHours: state.businessHours.trim(),
    isPublished: action === 'publish',
    themeConfig: {
      ...state.themeConfig
    }
  }, action)
}
</script>

<template>
  <form class="panel form-stack" @submit.prevent="handleSubmit('publish')">
    <div class="page-header">
      <UiSectionHeader
        :title="restaurant?.id ? 'Edita tu restaurante' : 'Crea tu restaurante'"
        description="Completa solo lo necesario para publicar una página clara y fácil de leer."
        eyebrow="Perfil del restaurante"
        title-tag="h1"
      />

      <UiBadge :tone="restaurant?.isPublished ? 'live' : 'draft'">
        {{ restaurant?.isPublished ? 'Publicado' : 'Borrador' }}
      </UiBadge>
    </div>

    <div v-if="errorMessage" class="feedback feedback--error">
      {{ errorMessage }}
    </div>

    <div class="rounded-2xl border border-default bg-muted p-4">
      <p class="text-sm font-medium text-highlighted">
        Estado actual: {{ state.isPublished ? 'Publicado' : 'Borrador' }}
      </p>
      <p class="mt-2 text-sm leading-6 text-muted">
        Guarda como borrador mientras completas la información o publícalo cuando ya esté listo para verse en la parte pública.
      </p>
    </div>

    <div class="form-grid form-grid--2">
      <UiInput
        v-model="state.name"
        autocomplete="organization"
        label="Nombre"
        required
        type="text"
      />

      <UiInput
        v-model="state.slug"
        hint="Se usa en la URL pública. Solo minúsculas, números y guiones."
        label="Slug"
        required
        type="text"
        @update:model-value="slugTouched = true"
      />
    </div>

    <UiTextarea
      v-model="state.description"
      label="Descripción"
      placeholder="Cuéntale a los visitantes qué hace especial a tu lugar."
    />

    <div class="form-grid form-grid--2">
      <UiInput v-model="state.cuisineType" label="Tipo de comida" type="text" />

      <UiInput v-model="state.businessHours" label="Horario" type="text" />
    </div>

    <div class="form-grid form-grid--2">
      <UiInput v-model="state.city" label="Ciudad" type="text" />

      <UiInput v-model="state.zone" label="Zona" type="text" />
    </div>

    <UiInput v-model="state.address" label="Dirección" type="text" />

    <div class="form-grid form-grid--2">
      <UiInput v-model="state.phone" label="Teléfono" type="text" />

      <UiInput v-model="state.whatsapp" label="WhatsApp" type="text" />
    </div>

    <div class="form-grid form-grid--2">
      <UiInput v-model="state.logoUrl" label="Logo URL" type="url" />

      <UiInput v-model="state.coverImageUrl" label="Portada URL" type="url" />
    </div>

    <DashboardRestaurantThemeSection
      v-model="state.themeConfig"
      :restaurant-name="state.name"
    />

    <div class="button-row">
      <UiButton
        :disabled="pending"
        intent="neutral"
        type="button"
        @click="handleSubmit('draft')"
      >
        {{ pending && submittedAction === 'draft' ? 'Guardando...' : draftButtonLabel }}
      </UiButton>

      <UiButton :disabled="pending" type="submit">
        {{ pending && submittedAction === 'publish' ? 'Guardando...' : publishButtonLabel }}
      </UiButton>
    </div>
  </form>
</template>
