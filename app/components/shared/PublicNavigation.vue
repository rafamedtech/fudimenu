<script setup lang="ts">
const props = defineProps<{
  isAuthenticated: boolean
}>()

const { appIcons } = useSiteTheme()
const route = useRoute()

const items = computed(() => {
  const base = [
    {
      label: 'Explorar',
      to: '/',
      icon: appIcons.value.compass,
      matches: ['/', '/r/']
    }
  ]

  if (props.isAuthenticated) {
    base.push({
      label: 'Dashboard',
      to: '/dashboard',
      icon: appIcons.value.dashboard,
      matches: ['/dashboard']
    })
  } else {
    base.push({
      label: 'Acceder',
      to: '/login',
      icon: appIcons.value.login,
      matches: ['/login']
    })
  }

  return base
})

function isActiveLink(matches: string[]) {
  return matches.some((match) => {
    if (match === '/') {
      return route.path === '/'
    }

    return route.path.startsWith(match)
  })
}
</script>

<template>
  <nav class="public-nav" aria-label="Principal">
    <UiButton
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      :icon="item.icon"
      :intent="isActiveLink(item.matches) ? 'primary' : 'ghost'"
      size="sm"
      class="public-nav__button"
    >
      {{ item.label }}
    </UiButton>
  </nav>
</template>
