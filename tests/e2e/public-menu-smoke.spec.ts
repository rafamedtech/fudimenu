/**
 * Smoke tests for the seeded demo menu.
 * Requires the seed to have been run: pnpm db:seed (or prisma db seed).
 * Tests skip automatically when USE_MOCKS=true (seed tenant not available in mock mode).
 */
import { expect, test } from '@playwright/test';

const SLUG = 'taqueria-don-pepe';
const BASE = `/m/${SLUG}`;
const USE_MOCKS = process.env.USE_MOCKS === 'true';

test.describe('public menu smoke — seeded demo', () => {
  test.skip(USE_MOCKS, 'Seed not available in mock mode — run against real DB');

  test('renders restaurant name as h1', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('h1')).toContainText('Marenca');
  });

  test('renders sticky nav with at least one category link', async ({ page }) => {
    await page.goto(BASE);
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    await expect(nav.locator('a').first()).toBeVisible();
  });

  test('renders item cards as <article> elements', async ({ page }) => {
    await page.goto(BASE);
    const articles = page.locator('article');
    await expect(articles.first()).toBeVisible();
    const count = await articles.count();
    expect(count).toBeGreaterThanOrEqual(30);
  });

  test('renders seeded Marenca dishes', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByText('Azapotzalco')).toBeVisible();
    await expect(page.getByText('Tlachomolli')).toBeVisible();
  });

  test('shows price in MXN format', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('body')).toContainText('$285');
  });

  test('free plan footer links to landing', async ({ page }) => {
    await page.goto(BASE);
    const footerLink = page.locator('footer a[href="/"]');
    await expect(footerLink).toBeVisible();
    await expect(footerLink).toContainText('FudiMenu');
  });

  test('page title includes restaurant name', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/Marenca/);
  });

  test('WhatsApp order buttons are server-rendered anchors', async ({ page }) => {
    await page.goto(BASE);
    // Links should be present in DOM immediately (no hydration needed)
    const waLinks = page.locator('a[data-track-wa]');
    await expect(waLinks.first()).toBeVisible();
    const href = await waLinks.first().getAttribute('href');
    expect(href).toMatch(/wa\.me|api\.whatsapp\.com/);
  });
});
