<script setup lang="ts">
import { formatLocation } from '~~/lib/formatters'
import type { PublicRestaurantResponse } from '~~/types/api'

const route = useRoute()
const { appIcons } = useSiteTheme()
const slug = computed(() => String(route.params.slug ?? ''))

const { data, pending, error } = await useAsyncData(
  () => `public-restaurant-${slug.value}`,
  async () => {
    const response = await $fetch<PublicRestaurantResponse>(`/api/public/restaurants/${slug.value}`)
    return response.restaurant
  },
  {
    watch: [slug]
  }
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Restaurant not found'
  })
}

const restaurant = computed(() => data.value)
const location = computed(() => formatLocation(restaurant.value?.city, restaurant.value?.zone) || 'Ubicacion por confirmar')
const description = computed(() =>
  restaurant.value?.description ||
  'Menu publico organizado por categorias para ayudarte a decidir rapido desde tu celular.'
)
const categories = computed(() =>
  (restaurant.value?.categories ?? []).map((category) => ({
    ...category,
    sectionId: `categoria-${category.slug || category.id}`
  }))
)
const totalItems = computed(() =>
  categories.value.reduce((sum, category) => sum + category.items.length, 0)
)
const contact = computed(() =>
  [restaurant.value?.phone, restaurant.value?.whatsapp].filter(Boolean).join(' · ')
)
const largestCategory = computed(() =>
  categories.value.reduce<(typeof categories.value)[number] | null>((largest, category) => {
    if (!largest || category.items.length > largest.items.length) {
      return category
    }

    return largest
  }, null)
)

useSeoMeta({
  title: () => `${restaurant.value?.name || 'Restaurante'} | Menú`,
  description: () =>
    restaurant.value?.description ||
    `Consulta el menu y la informacion basica de ${restaurant.value?.name || 'este restaurante'} en FudiMenu.`
})
</script>

<template>
  <div class="page-shell">
    <div class="container">
      <div v-if="pending && !restaurant" class="section-stack restaurant-detail">
        <section class="restaurant-hero">
          <USkeleton class="restaurant-detail__cover-skeleton" />

          <article class="panel restaurant-hero__content">
            <div class="button-row">
              <USkeleton class="restaurant-detail__chip-skeleton" />
              <USkeleton class="restaurant-detail__chip-skeleton restaurant-detail__chip-skeleton--wide" />
            </div>

            <div class="section-stack">
              <USkeleton class="restaurant-detail__title-skeleton" />
              <USkeleton class="restaurant-detail__line-skeleton" />
              <USkeleton class="restaurant-detail__line-skeleton restaurant-detail__line-skeleton--short" />
            </div>

            <div class="info-grid">
              <USkeleton v-for="index in 3" :key="index" class="restaurant-detail__info-skeleton" />
            </div>
          </article>
        </section>
      </div>

      <div v-else-if="restaurant" class="section-stack restaurant-detail">
        <section class="restaurant-hero">
          <div class="restaurant-hero__media restaurant-detail__cover">
            <img
              v-if="restaurant.coverImageUrl"
              :src="restaurant.coverImageUrl"
              :alt="`Portada de ${restaurant.name}`"
            >

            <div v-else class="restaurant-detail__cover-fallback">
              <UiBadge tone="live">
                Publicado
              </UiBadge>
              <div class="section-stack restaurant-detail__cover-copy">
                <p class="eyebrow restaurant-detail__cover-eyebrow">Menu publico</p>
                <h1 class="restaurant-detail__cover-title">{{ restaurant.name }}</h1>
                <p class="section-copy restaurant-detail__cover-description">
                  {{ restaurant.cuisineType || 'Restaurante local' }}
                </p>
              </div>
            </div>
          </div>

          <article class="panel restaurant-hero__content">
            <div class="button-row">
              <UiBadge v-if="restaurant.cuisineType" tone="primary">
                {{ restaurant.cuisineType }}
              </UiBadge>
              <UiBadge tone="secondary">
                {{ location }}
              </UiBadge>
              <UiBadge tone="live">
                Publicado
              </UiBadge>
            </div>

            <div class="restaurant-detail__headline">
              <div class="section-stack">
                <p class="eyebrow">Restaurante</p>
                <h1 class="restaurant-hero__title">{{ restaurant.name }}</h1>
                <p class="section-copy restaurant-detail__description">
                  {{ description }}
                </p>
              </div>

              <div v-if="restaurant.logoUrl" class="restaurant-detail__logo">
                <img :src="restaurant.logoUrl" :alt="`Logo de ${restaurant.name}`">
              </div>
            </div>

            <div class="restaurant-detail__summary-grid">
              <article class="surface-card info-card">
                <p class="restaurant-detail__info-label">Ubicacion</p>
                <h2 class="panel-title">{{ location }}</h2>
                <p class="section-copy">
                  {{ restaurant.address || 'Direccion por confirmar.' }}
                </p>
              </article>

              <article class="surface-card info-card">
                <p class="restaurant-detail__info-label">Horario</p>
                <h2 class="panel-title">Consulta rapida</h2>
                <p class="section-copy">
                  {{ restaurant.businessHours || 'Horario por confirmar.' }}
                </p>
              </article>

              <article class="surface-card info-card">
                <p class="restaurant-detail__info-label">Contacto</p>
                <h2 class="panel-title">Directo</h2>
                <p class="section-copy">
                  {{ contact || 'Contacto por confirmar.' }}
                </p>
              </article>
            </div>
          </article>
        </section>

        <section class="panel restaurant-detail__menu-intro">
          <div class="restaurant-detail__menu-intro-bar">
            <div class="section-stack">
              <div class="button-row">
                <UiBadge tone="secondary">
                  {{ categories.length }} categorías
                </UiBadge>
                <UiBadge tone="primary">
                  {{ totalItems }} platillos
                </UiBadge>
              </div>

              <div class="section-stack">
                <p class="eyebrow">Menú</p>
                <h2 class="section-heading">Categorías activas con precios visibles</h2>
                <p class="section-copy">
                  Solo mostramos platillos disponibles para que el menú sea claro, rápido y fácil de comparar.
                </p>
              </div>
            </div>

            <UiButton
              class="restaurant-detail__back-link"
              :icon="appIcons.back"
              intent="neutral"
              to="/"
            >
              Ver más restaurantes
            </UiButton>
          </div>

          <nav
            v-if="categories.length"
            class="menu-category-nav"
            aria-label="Ir a una categoría del menú"
          >
            <a
              v-for="category in categories"
              :key="category.id"
              class="menu-category-nav__link"
              :href="`#${category.sectionId}`"
            >
              <span>{{ category.name }}</span>
              <span class="menu-category-nav__count">{{ category.items.length }}</span>
            </a>
          </nav>
        </section>

        <section class="menu-layout">
          <div class="section-stack">
            <div v-if="!categories.length" class="panel empty-state">
              Este restaurante aún no tiene categorías activas con platillos disponibles.
            </div>

            <div v-else class="section-stack">
              <MenuCategorySection
                v-for="category in categories"
                :key="category.id"
                :category="category"
                :section-id="category.sectionId"
              />
            </div>
          </div>

          <aside class="section-stack restaurant-detail__sidebar">
            <section class="panel">
              <p class="eyebrow">Resumen</p>
              <h2 class="panel-title">Ideal para revisar rápido en celular</h2>
              <p class="section-copy">
                Menú ordenado por categorías, precios visibles y sin elementos fuera del flujo de decisión.
              </p>

              <div class="restaurant-detail__stats">
                <article class="metric-card">
                  <p class="metric-label">Categorías activas</p>
                  <p class="metric-value">{{ categories.length }}</p>
                  <p class="metric-hint">Solo secciones con contenido público visible.</p>
                </article>

                <article class="metric-card">
                  <p class="metric-label">Platillos disponibles</p>
                  <p class="metric-value">{{ totalItems }}</p>
                  <p class="metric-hint">Precios claros para comparar rápido.</p>
                </article>
              </div>
            </section>

            <section v-if="largestCategory" class="panel">
              <p class="eyebrow">Destacado</p>
              <h2 class="panel-title">{{ largestCategory.name }}</h2>
              <p class="section-copy">
                Es la categoría con más opciones visibles en este momento, con
                {{ largestCategory.items.length }} platillo{{ largestCategory.items.length === 1 ? '' : 's' }}.
              </p>
            </section>

            <section class="panel">
              <p class="eyebrow">¿Eres dueño?</p>
              <h2 class="panel-title">Administra tu restaurante en minutos</h2>
              <p class="section-copy">
                Crea tu perfil, publica tu menú y mantén disponibilidad actualizada desde el dashboard.
              </p>

              <div class="button-row">
                <UiButton :icon="appIcons.forward" to="/login" trailing>
                  Acceder al dashboard
                </UiButton>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </div>
  </div>
</template>
