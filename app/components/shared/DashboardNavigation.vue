<script setup lang="ts">
const { appIcons } = useSiteTheme()
const route = useRoute()

const navigation = computed(() => [
  {
    label: 'Resumen',
    to: '/dashboard',
    description: 'Vista general del panel y accesos rápidos.',
    icon: appIcons.value.dashboard
  },
  {
    label: 'Restaurantes',
    to: '/dashboard/restaurants',
    description: 'Listado para entrar al perfil o al menú de cada restaurante.',
    icon: appIcons.value.store
  },
  {
    label: 'Nuevo restaurante',
    to: '/dashboard/restaurants/new',
    description: 'Crea un nuevo perfil para capturarlo y publicarlo después.',
    icon: appIcons.value.plus
  }
])

function isActiveLink(path: string) {
  if (path === '/dashboard') {
    return route.path === path
  }

  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="dashboard-nav-list" aria-label="Dashboard">
    <div
      v-for="item in navigation"
      :key="item.to"
    >
      <UiButton
        :to="item.to"
        :icon="item.icon"
        :intent="isActiveLink(item.to) ? 'primary' : 'ghost'"
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
