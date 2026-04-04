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
  await expect(page.getByRole('link', { name: 'Resumen', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Restaurantes', exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Restaurantes', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Todos tus restaurantes' })).toBeVisible()
  await expect(page.getByText('Brasa Norte')).toBeVisible()
  await expect(page.getByText('Casa Marea')).toBeVisible()

  await page.getByRole('link', { name: 'Ir al menú' }).first().click()

  await expect(page).toHaveURL(/\/dashboard\/restaurants\/.+\/menu$/)
  await expect(page.getByRole('link', { name: 'Perfil', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Menú', exact: true })).toBeVisible()
})
