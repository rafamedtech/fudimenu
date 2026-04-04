import { expect, type Page } from '@playwright/test'

export async function gotoAndStabilize(page: Page, path: string) {
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('main')).toBeVisible()

  await page.evaluate(async () => {
    if ('fonts' in document) {
      await document.fonts.ready
    }
  })
}

export async function expectStablePageScreenshot(page: Page, name: string) {
  await expect(page).toHaveScreenshot(name)
}

async function toggleDisclosure(
  page: Page,
  locator: ReturnType<Page['getByRole']>,
  triggerName: RegExp
) {
  const isVisible = await locator.first().isVisible().catch(() => false)

  if (isVisible) {
    return false
  }

  const trigger = page.getByRole('button', { name: triggerName }).first()
  const triggerVisible = await trigger.isVisible().catch(() => false)

  if (!triggerVisible) {
    return false
  }

  await trigger.click()
  await expect(locator.first()).toBeVisible()
  return true
}

export async function ensurePublicNavigationVisible(page: Page) {
  return toggleDisclosure(page, page.getByRole('navigation', { name: 'Principal' }), /open menu|close menu/i)
}

export async function ensureDashboardNavigationVisible(page: Page) {
  return toggleDisclosure(
    page,
    page.getByRole('navigation', { name: 'Dashboard' }),
    /open sidebar|collapse sidebar/i
  )
}

export async function closePublicNavigationIfNeeded(page: Page) {
  const closeButton = page.getByRole('button', { name: /close menu/i }).first()

  if (await closeButton.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape')

    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click({ force: true })
    }
  }
}

export async function closeDashboardNavigationIfNeeded(page: Page) {
  const closeButton = page.getByRole('button', { name: /close sidebar/i }).first()

  if (await closeButton.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape')

    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click({ force: true })
    }
  }
}
