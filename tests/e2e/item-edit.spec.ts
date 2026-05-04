import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
const ISR_TIMEOUT_MS = 65_000;

let prisma: PrismaClient | null = null;

function getTestPrisma() {
  if (!databaseUrl) throw new Error('Missing DATABASE_URL or DIRECT_URL for E2E item edit test.');

  prisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  return prisma;
}

test.describe('item edit ISR', () => {
  test.setTimeout(80_000);

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

  test('editar precio -> visible en /m/[slug] en <65s', async ({ page, context }) => {
    test.skip(!databaseUrl, 'Missing DATABASE_URL or DIRECT_URL for E2E item edit test.');

    const db = getTestPrisma();
    const tenantId = randomUUID();
    const categoryId = randomUUID();
    const itemId = randomUUID();
    const userId = randomUUID();
    const suffix = randomUUID().slice(0, 8);
    const slug = `isr-edit-${suffix}`;
    const restaurantName = `ISR Cocina ${suffix}`;
    const itemName = `Quesadilla ISR ${suffix}`;
    tenantIds.push(tenantId);

    await db.tenant.create({
      data: {
        id: tenantId,
        createdBy: userId,
        slug,
        name: restaurantName,
        currency: 'MXN',
        plan: 'pro',
        categories: {
          create: {
            id: categoryId,
            name: 'Antojitos',
            sortOrder: 0,
          },
        },
        items: {
          create: {
            id: itemId,
            categoryId,
            name: itemName,
            priceCents: 9900,
            currency: 'MXN',
            isAvailable: true,
            sortOrder: 0,
          },
        },
      },
    });

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

    await page.goto(`/m/${slug}`);
    await expect(page.getByRole('heading', { name: restaurantName })).toBeVisible();
    await expect(page.getByRole('heading', { name: itemName })).toBeVisible();
    await expect(page.getByText('$99')).toBeVisible();

    await page.goto(`/menu/${itemId}`);
    await expect(page.getByRole('heading', { name: 'Editar platillo' })).toBeVisible();
    await page.getByLabel('Precio').fill('135.5');
    const editedAt = Date.now();
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page).toHaveURL(/\/menu$/);

    await expect
      .poll(
        async () => {
          await page.goto(`/m/${slug}`);
          return await page.getByText('$135.5').count();
        },
        { timeout: ISR_TIMEOUT_MS, intervals: [500, 1000, 2000, 5000] },
      )
      .toBeGreaterThan(0);

    expect(Date.now() - editedAt).toBeLessThan(ISR_TIMEOUT_MS);
  });
});
