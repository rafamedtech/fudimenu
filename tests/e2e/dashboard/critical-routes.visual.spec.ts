import { expect, test } from '@playwright/test'

import { enableOwnerSession } from '../helpers/auth'
import { gotoAndStabilize, expectStablePageScreenshot } from '../helpers/ui'

test.describe('dashboard visual regression', () => {
  test('dashboard home keeps summary cards and navigation stable', async ({ context, page, baseURL }) => {
    await enableOwnerSession(context, baseURL!)
    await gotoAndStabilize(page, '/dashboard')

    await expect(page.getByRole('heading', { name: 'Hola, Owner Demo' })).toBeVisible()
    await expect(page.getByRole('button', { name: /open sidebar|collapse sidebar/i })).toBeVisible()
    await expect(page.getByText('Brasa Norte')).toBeVisible()

    await expectStablePageScreenshot(page, 'dashboard-home.png')
  })

  test('dashboard restaurant list keeps card layout stable', async ({ context, page, baseURL }) => {
    await enableOwnerSession(context, baseURL!)
    await gotoAndStabilize(page, '/dashboard/restaurants')

    await expect(page.getByRole('heading', { name: 'Todos tus restaurantes' })).toBeVisible()
    await expect(page.getByText('Brasa Norte')).toBeVisible()
    await expect(page.getByText('Casa Marea')).toBeVisible()

    await expectStablePageScreenshot(page, 'dashboard-restaurants.png')
  })

  test('dashboard menu workspace keeps category and item managers stable', async ({ context, page, baseURL }) => {
    await enableOwnerSession(context, baseURL!)
    await gotoAndStabilize(page, '/dashboard/restaurants/restaurant-brasa/menu')

    await expect(page.getByRole('heading', { name: 'Brasa Norte' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ordena el menú por secciones' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Captura tu menú' })).toBeVisible()
    await expect(page.getByText('Queso fundido con chorizo')).toBeVisible()

    await expectStablePageScreenshot(page, 'dashboard-menu-workspace.png')
  })
})
