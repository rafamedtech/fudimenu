import { expect, test } from '@playwright/test'

test('redirects guests to login before entering the dashboard', async ({ page }) => {
  await page.goto('/dashboard')

  await expect(page).toHaveURL(/\/login\?redirect=\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Entra a tu dashboard de restaurante' })).toBeVisible()
})
