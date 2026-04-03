import { expect, test } from '@playwright/test'

test('lets guests discover restaurants and inspect a public menu', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Encuentra restaurantes con menús claros y decide más rápido.' })
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Brasa Norte' }).first()).toBeVisible()

  await page.locator('a[href="/r/brasa-norte"]').first().click()

  await expect(page).toHaveURL(/\/r\/brasa-norte$/)
  await expect(page.getByRole('heading', { name: 'Brasa Norte' })).toBeVisible()
  await expect(page.getByText('Queso fundido con chorizo')).toBeVisible()
  await expect(page.getByText('Taco vegetariano')).toHaveCount(0)
})
