import { expect, test } from '@playwright/test'

import { enableOwnerSession } from './helpers/auth'

test('shows the owner dashboard and restaurant list when the test session is enabled', async ({
  context,
  page,
  baseURL
}) => {
  await enableOwnerSession(context, baseURL!)

  await page.goto('/dashboard')

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Hola, Owner Demo' })).toBeVisible()
  await expect(page.getByText('Brasa Norte')).toBeVisible()

  await page.goto('/dashboard/restaurants')

  await expect(page.getByRole('heading', { name: 'Todos tus restaurantes' })).toBeVisible()
  await expect(page.getByText('Brasa Norte')).toBeVisible()
  await expect(page.getByText('Casa Marea')).toBeVisible()
})
