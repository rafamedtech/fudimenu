<script setup lang="ts">
import { buildRestaurantWorkspaceNavigation } from '~~/lib/dashboard-navigation'

const props = defineProps<{
  restaurantId: string
  restaurantSlug: string
  restaurantName: string
}>()

const { appIcons } = useSiteTheme()
const route = useRoute()

const items = computed(() =>
  buildRestaurantWorkspaceNavigation({
    currentPath: route.path,
    restaurantId: props.restaurantId,
    restaurantSlug: props.restaurantSlug,
    icons: {
      dashboard: appIcons.value.dashboard,
      store: appIcons.value.store,
      utensils: appIcons.value.utensils,
      external: appIcons.value.external
    }
  })
)
</script>

<template>
  <UiCard padding="md">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div class="space-y-2">
        <p class="eyebrow">Navegación del restaurante</p>
        <h2 class="text-lg font-semibold text-highlighted">
          {{ restaurantName }}
        </h2>
        <p class="text-sm leading-6 text-muted">
          Cambia entre el perfil del restaurante y la captura del menú sin salir del dashboard.
        </p>
      </div>

      <UNavigationMenu
        color="neutral"
        highlight
        :items="items"
        orientation="horizontal"
        variant="link"
        :ui="{
          root: 'w-full xl:w-auto',
          list: 'flex flex-wrap gap-1',
          item: 'py-0',
          link: 'rounded-[calc(var(--ui-radius)*3)] px-3 py-2 text-sm'
        }"
      />
    </div>
  </UiCard>
</template>
