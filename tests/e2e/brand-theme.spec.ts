import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
const INITIAL_PRIMARY = '#145C4D';
const UPDATED_PRIMARY = '#2F5BFF';

let prisma: PrismaClient | null = null;

function getTestPrisma() {
  if (!databaseUrl) throw new Error('Missing DATABASE_URL or DIRECT_URL for E2E brand theme test.');

  prisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  return prisma;
}

async function expectThemeApplied(page: Page, primaryColor: string) {
  const normalizedPrimary = primaryColor.toUpperCase();

  await expect
    .poll(async () =>
      page.locator('main').evaluate((node) =>
        getComputedStyle(node).getPropertyValue('--brand-primary').trim().toUpperCase(),
      ),
    )
    .toBe(normalizedPrimary);

  const audit = await page.locator('body').evaluate(() => {
    const legacyClassPattern = /\b(?:bg-white(?:\/\d+)?|bg-crema-(?:50|100)(?:\/\d+)?|to-white)\b/;
    const forbiddenColors = new Set([
      'rgb(255, 255, 255)',
      'rgb(255, 252, 245)',
      'rgb(255, 248, 231)',
      'rgb(255, 248, 225)',
      'rgb(255, 241, 194)',
      'rgb(244, 180, 0)',
      'rgb(255, 198, 51)',
      'rgb(214, 153, 0)',
    ]);
    const selector = [
      'main',
      'header',
      'nav',
      'article',
      'section',
      'form',
      'button',
      'a',
      'input',
      'select',
      'textarea',
      '[role="button"]',
      '[class*="rounded"]',
      '[class*="shadow"]',
      '[class*="border"]',
    ].join(',');

    function isVisible(element: Element) {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    }

    function shouldIgnore(element: Element) {
      const text = element.textContent?.trim() ?? '';
      return (
        text.includes('Open Next.js Dev Tools') ||
        element.matches('button[aria-label^="Usar color"]')
      );
    }

    return Array.from(document.querySelectorAll(selector))
      .filter((element) => isVisible(element) && !shouldIgnore(element))
      .flatMap((element) => {
        const style = getComputedStyle(element);
        const className =
          typeof element.getAttribute('class') === 'string' ? element.getAttribute('class') ?? '' : '';
        const label =
          element.getAttribute('aria-label') ||
          element.textContent?.replace(/\s+/g, ' ').trim().slice(0, 80) ||
          element.tagName.toLowerCase();
        const issues: Array<{
          label: string;
          tag: string;
          className: string;
          property: string;
          value: string;
        }> = [];

        if (legacyClassPattern.test(className)) {
          issues.push({
            label,
            tag: element.tagName.toLowerCase(),
            className,
            property: 'className',
            value: className,
          });
        }

        const themedProperties = {
          backgroundColor: style.backgroundColor,
          borderTopColor: style.borderTopColor,
          borderRightColor: style.borderRightColor,
          borderBottomColor: style.borderBottomColor,
          borderLeftColor: style.borderLeftColor,
        };

        for (const [property, value] of Object.entries(themedProperties)) {
          if (forbiddenColors.has(value)) {
            issues.push({
              label,
              tag: element.tagName.toLowerCase(),
              className,
              property,
              value,
            });
          }
        }

        return issues;
      });
  });

  expect(audit, JSON.stringify(audit.slice(0, 20), null, 2)).toEqual([]);
}

test.describe('brand theme propagation', () => {
  const tenantIds: string[] = [];

  test.afterEach(async () => {
    if (!databaseUrl || tenantIds.length === 0) return;

    await getTestPrisma().tenant.deleteMany({
      where: { id: { in: tenantIds.splice(0) } },
    });
  });

  test.afterAll(async () => {
    await prisma?.$disconnect();
  });

  test('settings brand color themes admin and public surfaces', async ({ page, context }) => {
    test.skip(!databaseUrl, 'Missing DATABASE_URL or DIRECT_URL for E2E brand theme test.');

    const db = getTestPrisma();
    const tenantId = randomUUID();
    const userId = randomUUID();
    const sectionId = randomUUID();
    const categoryId = randomUUID();
    const itemId = randomUUID();
    const suffix = randomUUID().slice(0, 8);
    const slug = `brand-theme-${suffix}`;
    const restaurantName = `Tema Cocina ${suffix}`;
    tenantIds.push(tenantId);

    await db.tenant.create({
      data: {
        id: tenantId,
        createdBy: userId,
        slug,
        name: restaurantName,
        currency: 'MXN',
        plan: 'pro',
        primaryColor: INITIAL_PRIMARY,
      },
    });

    await db.menuSection.create({
      data: {
        id: sectionId,
        tenantId,
        name: 'Especiales',
        accentColor: '#FFF8E7',
        sortOrder: 0,
      },
    });
    await db.category.create({
      data: {
        id: categoryId,
        tenantId,
        sectionId,
        name: 'Tacos',
        sortOrder: 0,
      },
    });
    await db.menuItem.create({
      data: {
        id: itemId,
        tenantId,
        categoryId,
        name: `Taco Tema ${suffix}`,
        priceCents: 9900,
        currency: 'MXN',
        isAvailable: true,
        sortOrder: 0,
      },
    });
    await db.membership.create({ data: { tenantId, userId, role: 'owner' } });

    await context.addCookies([
      {
        name: 'e2e_tenant_id',
        value: tenantId,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'e2e_user_id',
        value: userId,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/settings/brand');
    await expect(page.getByRole('heading', { name: 'Marca y tema' })).toBeVisible();
    await expectThemeApplied(page, INITIAL_PRIMARY);

    await page.getByLabel('Hex personalizado').fill(UPDATED_PRIMARY);
    await page.getByRole('button', { name: 'Guardar ajustes' }).click();
    await expect(page).toHaveURL(/\/settings\/brand\?saved=1/);
    await expect(page.getByText('Ajustes actualizados')).toBeVisible();
    await expectThemeApplied(page, UPDATED_PRIMARY);

    for (const path of ['/dashboard', '/menu', `/m/${slug}`]) {
      await page.goto(path);
      await expect(page.locator('main')).toBeVisible();
      await expectThemeApplied(page, UPDATED_PRIMARY);
    }
  });
});
