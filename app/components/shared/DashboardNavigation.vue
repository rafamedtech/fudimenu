<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    compact?: boolean
    orientation?: 'horizontal' | 'vertical'
  }>(),
  {
    compact: false,
    orientation: 'vertical'
  }
)

const { appIcons } = useSiteTheme()
const route = useRoute()

const navigation = computed(() => [
  {
    label: 'Resumen',
    to: '/dashboard',
    description: 'Vista general del panel y accesos rápidos.',
    icon: appIcons.value.dashboard,
    active: route.path === '/dashboard'
  },
  {
    label: 'Restaurantes',
    to: '/dashboard/restaurants',
    description: 'Listado para entrar al perfil o al menú de cada restaurante.',
    icon: appIcons.value.store,
    active: route.path.startsWith('/dashboard/restaurants')
  },
  {
    label: 'Nuevo restaurante',
    to: '/dashboard/restaurants/new',
    description: 'Crea un nuevo perfil para capturarlo y publicarlo después.',
    icon: appIcons.value.plus,
    active: route.path.startsWith('/dashboard/restaurants/new')
  }
])
</script>

<template>
  <UNavigationMenu
    v-if="props.compact"
    aria-label="Dashboard"
    color="neutral"
    highlight
    :items="navigation"
    :orientation="props.orientation"
    variant="link"
    :ui="{
      root: props.orientation === 'horizontal' ? 'min-w-0' : 'w-full',
      list: props.orientation === 'horizontal' ? 'gap-1' : 'w-full gap-1',
      item: props.orientation === 'horizontal' ? 'py-0' : 'w-full',
      link: props.orientation === 'horizontal'
        ? 'rounded-[calc(var(--ui-radius)*3)] px-3 py-2 text-sm'
        : 'w-full rounded-[calc(var(--ui-radius)*3)] px-3 py-2.5 text-sm'
    }"
  />

  <nav v-else class="dashboard-nav-list" aria-label="Dashboard">
    <div
      v-for="item in navigation"
      :key="item.to"
    >
      <UiButton
        :to="item.to"
        :icon="item.icon"
        :intent="item.active ? 'primary' : 'ghost'"
        size="lg"
        class="dashboard-nav-list__button"
      >
        {{ item.label }}
      </UiButton>

      <p class="mt-2 text-sm leading-6 text-muted">
        {{ item.description }}
      </p>
    </div>
  </nav>
</template>
