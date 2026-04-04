import { describe, expect, it } from 'vitest'

import {
  buildDashboardNavigation,
  buildRestaurantWorkspaceNavigation,
  isDashboardLinkActive
} from '~~/lib/dashboard-navigation'

const icons = {
  dashboard: 'i-test-dashboard',
  store: 'i-test-store',
  plus: 'i-test-plus',
  utensils: 'i-test-utensils',
  external: 'i-test-external'
}

describe('dashboard navigation helpers', () => {
  it('matches dashboard links using exact and nested routes', () => {
    expect(isDashboardLinkActive('/dashboard', '/dashboard')).toBe(true)
    expect(isDashboardLinkActive('/dashboard/restaurants', '/dashboard')).toBe(false)
    expect(isDashboardLinkActive('/dashboard/restaurants', '/dashboard/restaurants')).toBe(true)
    expect(isDashboardLinkActive('/dashboard/restaurants/abc/menu', '/dashboard/restaurants')).toBe(true)
    expect(isDashboardLinkActive('/dashboarding', '/dashboard')).toBe(false)
  })

  it('builds the main dashboard navigation with the active section', () => {
    const items = buildDashboardNavigation('/dashboard/restaurants/abc', icons)

    expect(items.map((item) => item.label)).toEqual([
      'Resumen',
      'Restaurantes',
      'Nuevo restaurante'
    ])
    expect(items[1]).toEqual(
      expect.objectContaining({
        icon: 'i-test-store',
        active: true,
        to: '/dashboard/restaurants'
      })
    )
    expect(items[0]).toEqual(expect.objectContaining({ active: false }))
  })

  it('keeps the create route active without marking the restaurant list as active', () => {
    const items = buildDashboardNavigation('/dashboard/restaurants/new', icons)

    expect(items[1]).toEqual(expect.objectContaining({ active: false }))
    expect(items[2]).toEqual(expect.objectContaining({ active: true }))
  })

  it('builds the restaurant workspace navigation with profile and menu states', () => {
    const items = buildRestaurantWorkspaceNavigation({
      currentPath: '/dashboard/restaurants/restaurant-1/menu',
      restaurantId: 'restaurant-1',
      restaurantSlug: 'brasa-norte',
      icons
    })

    expect(items[1]).toEqual(
      expect.objectContaining({
        label: 'Perfil',
        to: '/dashboard/restaurants/restaurant-1',
        active: false
      })
    )
    expect(items[2]).toEqual(
      expect.objectContaining({
        label: 'Menú',
        to: '/dashboard/restaurants/restaurant-1/menu',
        active: true
      })
    )
    expect(items[3]).toEqual(
      expect.objectContaining({
        label: 'Ver público',
        to: '/r/brasa-norte',
        target: '_blank'
      })
    )
  })
})
