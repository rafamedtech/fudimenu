import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

let prisma: PrismaClient | null = null;

function getTestPrisma() {
  if (!databaseUrl) throw new Error('Missing DATABASE_URL or DIRECT_URL for E2E billing test.');

  prisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  return prisma;
}

test.describe('billing upgrade', () => {
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

  test('Stripe checkout mock -> plan upgrade -> features desbloqueadas', async ({
    page,
    context,
  }) => {
    test.skip(!databaseUrl, 'Missing DATABASE_URL or DIRECT_URL for E2E billing test.');

    const tenantId = randomUUID();
    const userId = randomUUID();
    const suffix = randomUUID().slice(0, 8);
    tenantIds.push(tenantId);

    await getTestPrisma().tenant.create({
      data: {
        id: tenantId,
        createdBy: userId,
        slug: `billing-${suffix}`,
        name: `Billing Cocina ${suffix}`,
        currency: 'MXN',
        plan: 'free',
        memberships: {
          create: {
            userId,
            role: 'owner',
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

    await page.goto('/analytics');
    await expect(page.getByText('Analytics desbloquea decisiones')).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('button', { name: /Analytics es Pro/ }),
    ).toBeVisible();
    await expect(page.getByText('Vistas semana')).toHaveCount(0);

    await page.goto('/settings/billing');
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible();
    await page.getByRole('button', { name: 'Pagar Pro' }).click();

    await expect(page).toHaveURL(/\/settings\/billing\?checkout=success/);
    await expect(page.getByText('Pago iniciado')).toBeVisible();

    await expect
      .poll(async () => {
        const tenant = await getTestPrisma().tenant.findUnique({
          where: { id: tenantId },
          select: { plan: true },
        });
        return tenant?.plan;
      })
      .toBe('pro');

    await page.goto('/analytics');
    await expect(page.getByText('Analytics desbloquea decisiones')).toHaveCount(0);
    await expect(page.getByText('Vistas semana')).toBeVisible();
    await expect(page.getByText('Top 5 esta semana')).toBeVisible();
  });
});
