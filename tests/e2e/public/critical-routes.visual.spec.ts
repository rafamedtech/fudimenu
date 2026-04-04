import { expect, test } from '@playwright/test'

import { gotoAndStabilize, expectStablePageScreenshot } from '../helpers/ui'

test.describe('public visual regression', () => {
  test('home page keeps its public discovery layout', async ({ page }) => {
    await gotoAndStabilize(page, '/')

    await expect(
      page.getByRole('heading', { name: 'La forma más fácil de encontrar qué comer' })
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Brasa Norte' }).first()).toBeVisible()

    await expectStablePageScreenshot(page, 'home-page.png')
  })

  test('restaurant detail keeps menu hierarchy and prices visible', async ({ page }) => {
    await gotoAndStabilize(page, '/r/brasa-norte')

    await expect(page.getByRole('heading', { name: 'Brasa Norte' })).toBeVisible()
    await expect(page.locator('#categoria-entradas').getByRole('heading', { name: 'Entradas' })).toBeVisible()
    await expect(page.getByText('Queso fundido con chorizo')).toBeVisible()
    await expect(page.getByText('$129.00')).toBeVisible()

    await expectStablePageScreenshot(page, 'restaurant-detail-page.png')
  })

  test('login page keeps auth layout stable', async ({ page }) => {
    await gotoAndStabilize(page, '/login')

    await expect(page.getByRole('heading', { name: 'Entra a tu dashboard de restaurante' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar al dashboard' })).toBeVisible()

    await expectStablePageScreenshot(page, 'login-page.png')
  })
})
