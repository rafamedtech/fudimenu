<script setup lang="ts">
import { formatLocation } from "~~/lib/formatters";
import type { PublicRestaurantsResponse } from "~~/types/api";
import type { PublicRestaurantSummary } from "~~/types/domain";

function isNonEmptyString(value: string | null | undefined): value is string {
  return Boolean(value);
}

type HeroVerticalItem = PublicRestaurantSummary & {
  carouselKey: string;
};

type HeroLink = {
  label: string;
  to: string;
  icon?: string;
  trailingIcon?: string;
  color?: "primary" | "secondary" | "neutral" | "success" | "error";
  variant?: "solid" | "outline" | "ghost" | "soft" | "subtle" | "link";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

const { data, pending, error, refresh } =
  await useFetch<PublicRestaurantsResponse>("/api/public/restaurants", {
    default: () => ({ restaurants: [] }),
  });

const restaurants = computed<PublicRestaurantSummary[]>(
  () => data.value?.restaurants ?? [],
);
const { appIcons } = useSiteTheme();
const cuisineCount = computed(
  () =>
    new Set(
      restaurants.value
        .map((restaurant) => restaurant.cuisineType)
        .filter(isNonEmptyString),
    ).size,
);
const locationCount = computed(
  () =>
    new Set(
      restaurants.value
        .map((restaurant) => formatLocation(restaurant.city, restaurant.zone))
        .filter(isNonEmptyString),
    ).size,
);
const cuisineHighlights = computed<string[]>(() =>
  [
    ...new Set(
      restaurants.value
        .map((restaurant) => restaurant.cuisineType)
        .filter(isNonEmptyString),
    ),
  ].slice(0, 3),
);
const locationHighlights = computed<string[]>(() =>
  [
    ...new Set(
      restaurants.value
        .map((restaurant) => formatLocation(restaurant.city, restaurant.zone))
        .filter(isNonEmptyString),
    ),
  ].slice(0, 2),
);
const quickHighlights = computed<string[]>(() => [
  ...cuisineHighlights.value,
  ...locationHighlights.value,
]);
const featuredRestaurant = computed<PublicRestaurantSummary | null>(
  () => restaurants.value[0] ?? null,
);
const heroCommandText = computed<string>(() =>
  featuredRestaurant.value
    ? `open /r/${featuredRestaurant.value.slug}`
    : "list published restaurants",
);
const heroVerticalItems = computed<HeroVerticalItem[]>(() => {
  if (!restaurants.value.length) {
    return [];
  }

  return Array.from(
    { length: Math.max(restaurants.value.length * 2, 6) },
    (_, index) => {
      const restaurant = restaurants.value[index % restaurants.value.length]!;

      return {
        ...restaurant,
        carouselKey: `vertical-${restaurant.id}-${index}`,
      };
    },
  );
});
const heroLinks = computed<HeroLink[]>(() => [
  {
    label: "Publica tu restaurante",
    to: "/login",
    icon: appIcons.value.store,
    size: "xl",
  },
  {
    label: "Ver restaurantes",
    to: "#restaurantes",
    color: "neutral",
    variant: "subtle",
    trailingIcon: appIcons.value.forward,
    size: "xl",
  },
]);
const heroTickerItems = computed(() => {
  const items = [
    "Restaurantes publicados",
    "Menu claro",
    "Mobile-first",
    ...quickHighlights.value,
  ];

  return [...new Set(items)].filter(isNonEmptyString);
});

useSeoMeta({
  title: "Descubre restaurantes y menús",
  description:
    "Encuentra restaurantes locales y revisa menús claros, rápidos y fáciles de leer desde tu celular.",
});
</script>

<template>
  <div class="page-shell home-page">
    <div class="container section-stack">
      <section class="home-hero home-hero--nuxt">
        <section class="home-page-hero">
          <div class="home-page-hero__backdrop" />
          <div class="home-page-hero__container">
            <div class="home-page-hero__content">
              <div class="home-page-hero__body">
                <h1 class="home-page-hero__title">
                  <span>La forma más fácil</span>
                  <span class="home-page-hero__title-accent">de encontrar</span>
                  <span>qué comer</span>
                </h1>
                <p class="home-page-hero__description">
                  Descubre restaurantes publicados con una interfaz rápida,
                  visual y pensada para móvil: portada, tipo de comida, zona
                  resumida y acceso inmediato al detalle.
                </p>
              </div>

              <div class="home-page-hero__actions">
                <UiButton
                  v-for="link in heroLinks"
                  :key="link.label"
                  v-bind="link"
                >
                  {{ link.label }}
                </UiButton>
              </div>

              <div class="home-page-hero__command">
                <UIcon
                  name="i-lucide-search"
                  class="home-page-hero__command-icon"
                />
                <span>{{ heroCommandText }}</span>
              </div>

              <div v-if="heroTickerItems.length" class="home-page-hero__ticker">
                <div class="home-page-hero__ticker-row">
                  <UiBadge
                    v-for="item in heroTickerItems"
                    :key="item"
                    tone="neutral"
                    class="shrink-0 home-page-hero__signal"
                  >
                    {{ item }}
                  </UiBadge>
                </div>
              </div>
            </div>

            <div class="home-page-hero__aside">
              <div class="home-page-hero__panel">
                <div v-if="pending" class="home-page-hero__skeletons">
                  <div class="home-page-hero__skeleton-card" />
                  <div
                    class="home-page-hero__skeleton-card home-page-hero__skeleton-card--muted"
                  />
                </div>

                <div v-else-if="error" class="feedback feedback--error">
                  No pudimos cargar la vista previa de restaurantes.
                </div>

                <div
                  v-else-if="heroVerticalItems.length"
                  class="home-page-hero__carousel-shell"
                >
                  <div class="home-page-hero__vertical-carousel">
                    <div class="home-page-hero__vertical-track">
                      <article
                        v-for="item in heroVerticalItems"
                        :key="item.carouselKey"
                        class="home-page-hero__vertical-card"
                      >
                        <div class="home-page-hero__vertical-card-body">
                          <div class="home-page-hero__vertical-card-copy">
                            <p class="home-page-hero__vertical-card-title">
                              {{ item.name }}
                            </p>
                            <p
                              class="home-page-hero__vertical-card-description"
                            >
                              {{
                                item.description ||
                                "Consulta el menú público y revisa rápido la propuesta del restaurante."
                              }}
                            </p>
                          </div>

                          <div class="home-page-hero__vertical-card-meta">
                            <UiBadge tone="secondary">
                              {{ item.cuisineType || "Restaurante publicado" }}
                            </UiBadge>
                            <UiBadge tone="neutral">
                              {{
                                formatLocation(item.city, item.zone) ||
                                "Ubicación por confirmar"
                              }}
                            </UiBadge>
                          </div>
                        </div>

                        <img
                          v-if="item.coverImageUrl"
                          :src="item.coverImageUrl"
                          :alt="`Portada de ${item.name}`"
                          class="home-page-hero__vertical-card-image"
                          loading="lazy"
                          decoding="async"
                        />

                        <div
                          v-else
                          class="home-page-hero__vertical-card-fallback"
                        >
                          <span>{{ item.name.slice(0, 2).toUpperCase() }}</span>
                        </div>
                      </article>
                    </div>
                  </div>
                </div>

                <div v-else class="panel empty-state">
                  Aun no hay restaurantes publicados para mostrar en el home.
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>

      <USeparator class="home-page-divider" color="neutral" size="sm" />

      <section id="restaurantes" class="section-stack home-page-listing">
        <UiSectionHeader
          description="Perfiles públicos listos para comparar rápido desde móvil: imagen principal, tipo de comida, ubicación resumida y entrada directa al detalle."
          eyebrow="Listado público"
          title="Todos los restaurantes publicados"
        >
          <template #actions>
            <UiButton
              :icon="appIcons.refresh"
              intent="neutral"
              type="button"
              @click="refresh()"
            >
              Recargar
            </UiButton>
          </template>
        </UiSectionHeader>

        <div
          v-if="pending"
          class="cards-grid"
          aria-label="Cargando restaurantes"
        >
          <RestaurantsCardSkeleton v-for="index in 3" :key="index" />
        </div>

        <div v-else-if="error" class="feedback feedback--error">
          <div class="section-stack">
            <p>No pudimos cargar los restaurantes publicados.</p>
            <div class="button-row">
              <UiButton
                :icon="appIcons.refresh"
                intent="neutral"
                type="button"
                @click="refresh()"
              >
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
