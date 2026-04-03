import { expect, test } from '@playwright/test'

import { enableOwnerSession } from './helpers/auth'

test('lets the owner open the new restaurant workspace', async ({
  context,
  page,
  baseURL
}) => {
  await enableOwnerSession(context, baseURL!)

  await page.goto('/dashboard/restaurants/new')

  await expect(page).toHaveURL(/\/dashboard\/restaurants\/new$/)
  await expect(page.getByRole('heading', { name: 'Crea tu restaurante' })).toBeVisible()
  await expect(page.getByText('Estado actual: Borrador')).toBeVisible()
  await expect(page.getByText('Se usa en la URL pública. Solo minúsculas, números y guiones.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Guardar borrador' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Crear y publicar' })).toBeVisible()
})
