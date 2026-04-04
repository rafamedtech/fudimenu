import { expect, test } from '@playwright/test'

import { enableOwnerSession } from '../helpers/auth'
import {
  closeDashboardNavigationIfNeeded,
  closePublicNavigationIfNeeded,
  ensureDashboardNavigationVisible,
  ensurePublicNavigationVisible,
  gotoAndStabilize
} from '../helpers/ui'

test.describe('critical route aria snapshots', () => {
  test('home preserves public navigation and main semantics', async ({ page }) => {
    await gotoAndStabilize(page, '/')
    await ensurePublicNavigationVisible(page)

    await expect(page.getByRole('navigation', { name: 'Principal' })).toMatchAriaSnapshot({
      name: 'home-nav.aria.yml'
    })

    await closePublicNavigationIfNeeded(page)

    await expect(page.getByRole('main')).toMatchAriaSnapshot({
      name: 'home-main.aria.yml'
    })
  })

  test('restaurant detail preserves menu accessibility structure', async ({ page }) => {
    await gotoAndStabilize(page, '/r/brasa-norte')
    await ensurePublicNavigationVisible(page)

    await expect(page.getByRole('navigation', { name: 'Principal' })).toMatchAriaSnapshot({
      name: 'restaurant-nav.aria.yml'
    })

    await closePublicNavigationIfNeeded(page)

    await expect(page.getByRole('navigation', { name: 'Ir a una categoría del menú' })).toMatchAriaSnapshot({
      name: 'restaurant-menu-nav.aria.yml'
    })

    await expect(page.getByRole('main')).toMatchAriaSnapshot({
      name: 'restaurant-main.aria.yml'
    })
  })

  test('login preserves headings, labels and auth actions', async ({ page }) => {
    await gotoAndStabilize(page, '/login')

    await expect(page.getByRole('main')).toMatchAriaSnapshot({
      name: 'login-main.aria.yml'
    })
  })

  test('dashboard home preserves dashboard nav and summary structure', async ({ context, page, baseURL }) => {
    await enableOwnerSession(context, baseURL!)
    await gotoAndStabilize(page, '/dashboard')
    await ensureDashboardNavigationVisible(page)

    await expect(page.getByRole('navigation', { name: 'Dashboard' })).toMatchAriaSnapshot({
      name: 'dashboard-nav.aria.yml'
    })

    await closeDashboardNavigationIfNeeded(page)

    await expect(page.getByRole('main')).toMatchAriaSnapshot({
      name: 'dashboard-main.aria.yml'
    })
  })

  test('dashboard restaurants preserves restaurant list semantics', async ({ context, page, baseURL }) => {
    await enableOwnerSession(context, baseURL!)
    await gotoAndStabilize(page, '/dashboard/restaurants')

    await expect(page.getByRole('main')).toMatchAriaSnapshot({
      name: 'dashboard-restaurants-main.aria.yml'
    })
  })

  test('dashboard menu preserves category and item editing structure', async ({ context, page, baseURL }) => {
    await enableOwnerSession(context, baseURL!)
    await gotoAndStabilize(page, '/dashboard/restaurants/restaurant-brasa/menu')

    await expect(page.getByRole('main')).toMatchAriaSnapshot({
      name: 'dashboard-menu-main.aria.yml'
    })
  })
})
