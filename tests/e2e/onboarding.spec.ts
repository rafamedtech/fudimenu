import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

let prisma: PrismaClient | null = null;

function getTestPrisma() {
  if (!databaseUrl) throw new Error('Missing DATABASE_URL or DIRECT_URL for E2E onboarding test.');

  prisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  return prisma;
}

test.describe('onboarding golden path', () => {
  const userIds: string[] = [];

  test.afterEach(async () => {
    if (!databaseUrl || userIds.length === 0) return;

    await getTestPrisma().tenant.deleteMany({
      where: { createdBy: { in: userIds.splice(0) } },
    });
  });

  test.afterAll(async () => {
    await prisma?.$disconnect();
  });

  test('signup -> onboarding -> primer item -> vista publica', async ({ page, context }) => {
    test.skip(!databaseUrl, 'Missing DATABASE_URL or DIRECT_URL for E2E onboarding test.');

    const userId = randomUUID();
    const suffix = randomUUID().slice(0, 8);
    const restaurantName = `Cocina Golden ${suffix}`;
    const itemName = `Taco Golden ${suffix}`;
    userIds.push(userId);

    await context.addCookies([
      {
        name: 'e2e_user_id',
        value: userId,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'e2e_user_email',
        value: `golden-${suffix}@fudimenu.test`,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/onboarding');
    await expect(page.getByRole('heading', { name: '¿Cómo se llama tu changarro?' })).toBeVisible();

    await page.getByLabel('Nombre del restaurante').fill(restaurantName);
    await page.getByRole('button', { name: /Mexicana/ }).click();
    await page.getByRole('button', { name: /Siguiente/ }).click();

    await expect(page.getByRole('heading', { name: 'Tu primer platillo' })).toBeVisible();
    await page.getByLabel('Nombre').fill(itemName);
    await page.getByLabel('Precio').fill('123.45');
    await page.getByRole('button', { name: 'Crear mi menú' }).click();

    await expect(page.getByRole('dialog', { name: '¡Listo, jefe!' })).toBeVisible();
    await expect(page.getByText('Tu menú ya vive en internet.')).toBeVisible();

    await expect
      .poll(async () => {
        const tenant = await getTestPrisma().tenant.findFirst({
          where: { createdBy: userId },
          select: { slug: true },
        });
        return tenant?.slug ?? '';
      })
      .not.toBe('');

    const tenant = await getTestPrisma().tenant.findFirstOrThrow({
      where: { createdBy: userId },
      select: { slug: true },
    });

    await page.goto(`/m/${tenant!.slug}`);
    await expect(page.getByRole('heading', { name: restaurantName })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tacos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: itemName })).toBeVisible();
    await expect(page.getByText('$123.45')).toBeVisible();
  });
});
