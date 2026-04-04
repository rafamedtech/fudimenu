<script setup lang="ts">
import { buildDashboardNavigation } from '~~/lib/dashboard-navigation'

const props = defineProps<{
  collapsed?: boolean
}>()

const { appIcons } = useSiteTheme()
const route = useRoute()

const items = computed(() =>
  buildDashboardNavigation(route.path, {
    dashboard: appIcons.value.dashboard,
    store: appIcons.value.store,
    plus: appIcons.value.plus,
    utensils: appIcons.value.utensils,
    external: appIcons.value.external
  })
)
</script>

<template>
  <UNavigationMenu
    aria-label="Dashboard"
    :collapsed="props.collapsed"
    color="neutral"
    highlight
    :items="items"
    orientation="vertical"
    tooltip
    popover
    variant="pill"
    :ui="{
      root: 'w-full',
      list: 'w-full gap-1',
      item: 'w-full py-0',
      link: props.collapsed
        ? 'justify-center rounded-[calc(var(--ui-radius)*3)] px-2.5 py-2.5'
        : 'w-full rounded-[calc(var(--ui-radius)*3)] px-3 py-2.5'
    }"
  />
</template>
