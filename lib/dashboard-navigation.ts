import type { NavigationMenuItem } from '@nuxt/ui'

interface DashboardNavigationIcons {
  dashboard: string
  store: string
  plus: string
  utensils: string
  external: string
}

interface RestaurantWorkspaceNavigationOptions {
  currentPath: string
  restaurantId: string
  restaurantSlug: string
  icons: Pick<DashboardNavigationIcons, 'dashboard' | 'store' | 'utensils' | 'external'>
}

function isRestaurantsSectionActive(currentPath: string) {
  return currentPath === '/dashboard/restaurants'
    || (currentPath.startsWith('/dashboard/restaurants/') && !currentPath.startsWith('/dashboard/restaurants/new'))
}

export function isDashboardLinkActive(currentPath: string, targetPath: string) {
  if (targetPath === '/dashboard') {
    return currentPath === targetPath
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}

export function buildDashboardNavigation(
  currentPath: string,
  icons: DashboardNavigationIcons
): NavigationMenuItem[] {
  return [
    {
      label: 'Resumen',
      icon: icons.dashboard,
      to: '/dashboard',
      active: isDashboardLinkActive(currentPath, '/dashboard')
    },
    {
      label: 'Restaurantes',
      icon: icons.store,
      to: '/dashboard/restaurants',
      active: isRestaurantsSectionActive(currentPath)
    },
    {
      label: 'Nuevo restaurante',
      icon: icons.plus,
      to: '/dashboard/restaurants/new',
      active: currentPath === '/dashboard/restaurants/new'
    }
  ]
}

export function buildRestaurantWorkspaceNavigation({
  currentPath,
  restaurantId,
  restaurantSlug,
  icons
}: RestaurantWorkspaceNavigationOptions): NavigationMenuItem[] {
  const profilePath = `/dashboard/restaurants/${restaurantId}`
  const menuPath = `/dashboard/restaurants/${restaurantId}/menu`

  return [
    {
      label: 'Todos tus restaurantes',
      icon: icons.store,
      to: '/dashboard/restaurants',
      active: currentPath === '/dashboard/restaurants'
    },
    {
      label: 'Perfil',
      icon: icons.dashboard,
      to: profilePath,
      active: currentPath === profilePath
    },
    {
      label: 'Menú',
      icon: icons.utensils,
      to: menuPath,
      active: currentPath === menuPath
    },
    {
      label: 'Ver público',
      icon: icons.external,
      to: `/r/${restaurantSlug}`,
      target: '_blank'
    }
  ]
}
