<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    isAuthenticated: boolean
    orientation?: 'horizontal' | 'vertical'
  }>(),
  {
    orientation: 'horizontal'
  }
)

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

  return base.map((item) => ({
    ...item,
    active: item.matches.some((match) => {
      if (match === '/') {
        return route.path === '/'
      }

      return route.path.startsWith(match)
    })
  }))
})
</script>

<template>
  <UNavigationMenu
    aria-label="Principal"
    color="neutral"
    highlight
    :items="items"
    :orientation="orientation"
    variant="link"
    :ui="{
      root: orientation === 'horizontal' ? 'min-w-0' : 'w-full',
      list: orientation === 'horizontal' ? 'gap-1' : 'w-full gap-1',
      item: orientation === 'horizontal' ? 'py-0' : 'w-full',
      link: orientation === 'horizontal'
        ? 'rounded-[calc(var(--ui-radius)*3)] px-3 py-2 text-sm'
        : 'w-full rounded-[calc(var(--ui-radius)*3)] px-3 py-2.5 text-sm'
    }"
  />
</template>
