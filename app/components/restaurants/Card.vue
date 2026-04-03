<script setup lang="ts">
import { formatLocation } from '~~/lib/formatters'
import type { PublicRestaurantSummary } from '~~/types/domain'

const props = defineProps<{
  restaurant: PublicRestaurantSummary
}>()

const { appIcons } = useSiteTheme()

const destination = computed(() => `/r/${props.restaurant.slug}`)
const location = computed(() => formatLocation(props.restaurant.city, props.restaurant.zone) || 'Ubicacion por confirmar')
const cuisineType = computed(() => props.restaurant.cuisineType || 'Tipo de comida por confirmar')
const description = computed(() =>
  props.restaurant.description || 'Consulta su menu publico y revisa la informacion principal antes de decidir.'
)
const slugLabel = computed(() => `/r/${props.restaurant.slug}`)
</script>

<template>
  <NuxtLink
    class="restaurant-card restaurant-card--interactive surface-card"
    :to="destination"
    :aria-label="`Abrir el restaurante ${restaurant.name}`"
  >
    <div class="restaurant-card__cover">
      <div class="restaurant-card__cover-top">
        <UiBadge tone="secondary">
          Publicado
        </UiBadge>
      </div>

      <img
        v-if="restaurant.coverImageUrl"
        :src="restaurant.coverImageUrl"
        :alt="`Portada de ${restaurant.name}`"
        loading="lazy"
        decoding="async"
      >

      <div v-else class="restaurant-card__cover-fallback">
        <UiBadge tone="live">
          Publicado
        </UiBadge>
        <p class="restaurant-card__cover-title">{{ restaurant.name }}</p>
      </div>
    </div>

    <div class="restaurant-card__content">
      <div class="button-row restaurant-card__tags">
        <UiBadge tone="primary">
          {{ cuisineType }}
        </UiBadge>
        <UiBadge tone="secondary">
          {{ location }}
        </UiBadge>
      </div>

      <div class="section-stack restaurant-card__body">
        <h2 class="card-title">{{ restaurant.name }}</h2>
        <p class="section-copy restaurant-card__description">
          {{ description }}
        </p>
      </div>

      <div class="restaurant-card__meta">
        <span class="restaurant-card__meta-item">
          <UIcon :name="appIcons.mapPin" />
          {{ location }}
        </span>
        <span class="restaurant-card__meta-item">
          <UIcon :name="appIcons.link" />
          {{ slugLabel }}
        </span>
      </div>

      <div class="restaurant-card__footer">
        <span class="restaurant-card__cta">Ver detalle y menu</span>
        <UIcon :name="appIcons.external" class="restaurant-card__cta-icon" />
      </div>
    </div>
  </NuxtLink>
</template>
