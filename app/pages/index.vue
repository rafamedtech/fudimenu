<script setup lang="ts">
import { formatLocation } from '~~/lib/formatters'
import type { PublicRestaurantsResponse } from '~~/types/api'

const { data, pending, error, refresh } = await useFetch<PublicRestaurantsResponse>('/api/public/restaurants', {
  default: () => ({ restaurants: [] })
})

const restaurants = computed(() => data.value?.restaurants ?? [])
const featuredRestaurant = computed(() => restaurants.value[0] ?? null)
const supportingRestaurants = computed(() => restaurants.value.slice(1, 4))
const { appIcons } = useSiteTheme()
const cuisineCount = computed(() => new Set(restaurants.value.map((restaurant) => restaurant.cuisineType).filter(Boolean)).size)
const locationCount = computed(() =>
  new Set(
    restaurants.value
      .map((restaurant) => formatLocation(restaurant.city, restaurant.zone))
      .filter(Boolean)
  ).size
)
const cuisineHighlights = computed(() =>
  [...new Set(restaurants.value.map((restaurant) => restaurant.cuisineType).filter(Boolean))].slice(0, 3)
)
const locationHighlights = computed(() =>
  [...new Set(restaurants.value.map((restaurant) => formatLocation(restaurant.city, restaurant.zone)).filter(Boolean))].slice(0, 2)
)
const quickHighlights = computed(() => [...cuisineHighlights.value, ...locationHighlights.value])

useSeoMeta({
  title: 'Descubre restaurantes y menús',
  description:
    'Encuentra restaurantes locales y revisa menús claros, rápidos y fáciles de leer desde tu celular.'
})
</script>

<template>
  <div class="page-shell">
    <div class="container section-stack">
      <section class="home-hero">
        <article class="hero__card home-hero__intro surface-card">
          <div class="section-stack home-hero__stack">
            <div class="button-row">
              <UiBadge tone="secondary">
                Publicados: {{ restaurants.length }}
              </UiBadge>
              <UiBadge tone="primary">
                Inspiración editorial
              </UiBadge>
            </div>

            <div class="section-stack home-hero__headline">
              <p class="eyebrow">Descubre dónde comer</p>
              <h1 class="hero__title home-hero__title">
                Encuentra restaurantes con menús claros y decide más rápido.
              </h1>
              <p class="hero__copy">
                Explora restaurantes publicados con una vista más visual: imagen principal, tipo de
                comida, zona resumida y acceso inmediato al detalle por slug.
              </p>
            </div>

            <div class="button-row">
              <UiButton :icon="appIcons.store" to="/login">
                Publica tu restaurante
              </UiButton>
              <UiButton :icon="appIcons.down" intent="neutral" to="#restaurantes">
                Ver restaurantes
              </UiButton>
            </div>

            <div v-if="quickHighlights.length" class="home-hero__chip-row">
              <span
                v-for="highlight in quickHighlights"
                :key="highlight"
                class="home-hero__chip"
              >
                {{ highlight }}
              </span>
            </div>

            <div class="hero__metrics home-hero__metrics">
              <article class="metric-card">
                <p class="metric-label">Restaurantes publicados</p>
                <p class="metric-value">{{ restaurants.length }}</p>
                <p class="metric-hint">Solo perfiles visibles al publico.</p>
              </article>

              <article class="metric-card">
                <p class="metric-label">Tipos de comida</p>
                <p class="metric-value">{{ cuisineCount }}</p>
                <p class="metric-hint">Resumen rapido para comparar opciones.</p>
              </article>

              <article class="metric-card">
                <p class="metric-label">Zonas visibles</p>
                <p class="metric-value">{{ locationCount }}</p>
                <p class="metric-hint">Ubicacion resumida en cada tarjeta.</p>
              </article>

              <article class="metric-card">
                <p class="metric-label">Detalle por slug</p>
                <p class="metric-value">/r</p>
                <p class="metric-hint">Cada tarjeta lleva directo al menu.</p>
              </article>
            </div>
          </div>
        </article>

        <div class="home-hero__showcase">
          <article v-if="featuredRestaurant" class="home-featured surface-card">
            <div class="home-featured__media">
              <img
                v-if="featuredRestaurant.coverImageUrl"
                :src="featuredRestaurant.coverImageUrl"
                :alt="`Portada de ${featuredRestaurant.name}`"
                loading="lazy"
                decoding="async"
              >

              <div v-else class="home-featured__fallback">
                <UiBadge tone="live">
                  Publicado
                </UiBadge>
                <p class="home-featured__fallback-title">{{ featuredRestaurant.name }}</p>
              </div>

              <div class="home-featured__floating-card">
                <p class="home-featured__floating-label">Selección pública</p>
                <p class="home-featured__floating-value">{{ featuredRestaurant.cuisineType || 'Cocina local' }}</p>
                <p class="home-featured__floating-copy">
                  {{ formatLocation(featuredRestaurant.city, featuredRestaurant.zone) || 'Ubicación por confirmar' }}
                </p>
              </div>
            </div>

            <div class="home-featured__content">
              <div class="button-row">
                <UiBadge tone="secondary">
                  Restaurante destacado
                </UiBadge>
                <UiBadge tone="neutral">
                  /r/{{ featuredRestaurant.slug }}
                </UiBadge>
              </div>

              <div class="section-stack">
                <h2 class="home-featured__title">{{ featuredRestaurant.name }}</h2>
                <p class="section-copy home-featured__copy">
                  {{
                    featuredRestaurant.description ||
                    'Consulta su menú público y entiende la propuesta del restaurante en segundos.'
                  }}
                </p>
              </div>

              <div class="home-featured__meta">
                <span class="home-featured__meta-item">
                  <UIcon :name="appIcons.mapPin" />
                  {{ formatLocation(featuredRestaurant.city, featuredRestaurant.zone) || 'Ubicación por confirmar' }}
                </span>
                <span class="home-featured__meta-item">
                  <UIcon :name="appIcons.utensils" />
                  {{ featuredRestaurant.cuisineType || 'Tipo de comida por confirmar' }}
                </span>
              </div>

              <div class="button-row">
                <UiButton :to="`/r/${featuredRestaurant.slug}`" :icon="appIcons.external">
                  Ver restaurante
                </UiButton>
              </div>
            </div>
          </article>

          <div v-if="supportingRestaurants.length" class="home-preview-list">
            <NuxtLink
              v-for="restaurant in supportingRestaurants"
              :key="restaurant.id"
              class="home-preview surface-card"
              :to="`/r/${restaurant.slug}`"
            >
              <div class="home-preview__media">
                <img
                  v-if="restaurant.coverImageUrl"
                  :src="restaurant.coverImageUrl"
                  :alt="`Vista previa de ${restaurant.name}`"
                  loading="lazy"
                  decoding="async"
                >

                <div v-else class="home-preview__fallback">
                  <span>{{ restaurant.name.slice(0, 2).toUpperCase() }}</span>
                </div>
              </div>

              <div class="home-preview__content">
                <p class="home-preview__eyebrow">{{ restaurant.cuisineType || 'Restaurante publicado' }}</p>
                <h3 class="home-preview__title">{{ restaurant.name }}</h3>
                <p class="home-preview__copy">
                  {{ formatLocation(restaurant.city, restaurant.zone) || 'Ubicación por confirmar' }}
                </p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>

      <section id="restaurantes" class="section-stack">
        <UiSectionHeader
          description="Una cuadrícula simple y rápida de escanear en móvil, inspirada en la referencia pero enfocada en el objetivo real del MVP: descubrir, abrir y entender el menú rápido."
          eyebrow="Listado público"
          title="Todos los restaurantes publicados"
        >
          <template #actions>
            <UiButton :icon="appIcons.refresh" intent="neutral" type="button" @click="refresh()">
              Recargar
            </UiButton>
          </template>
        </UiSectionHeader>

        <div v-if="pending" class="cards-grid" aria-label="Cargando restaurantes">
          <RestaurantsCardSkeleton
            v-for="index in 3"
            :key="index"
          />
        </div>

        <div v-else-if="error" class="feedback feedback--error">
          <div class="section-stack">
            <p>No pudimos cargar los restaurantes publicados.</p>
            <div class="button-row">
              <UiButton :icon="appIcons.refresh" intent="neutral" type="button" @click="refresh()">
                Intentar de nuevo
              </UiButton>
            </div>
          </div>
        </div>

        <div v-else-if="!restaurants.length" class="panel empty-state">
          Aun no hay restaurantes publicados.
        </div>

        <div v-else class="cards-grid cards-grid--public">
          <RestaurantsCard
            v-for="restaurant in restaurants"
            :key="restaurant.id"
            :restaurant="restaurant"
          />
        </div>
      </section>
    </div>
  </div>
</template>
