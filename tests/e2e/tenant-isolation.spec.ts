import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

let prisma: PrismaClient | null = null;

function getTestPrisma() {
  if (!databaseUrl) throw new Error('Missing DATABASE_URL or DIRECT_URL for E2E tenant isolation test.');

  prisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  return prisma;
}

function authCookie(tenantId: string) {
  return `e2e_tenant_id=${tenantId}; e2e_user_id=${randomUUID()}`;
}

test.describe('tenant isolation', () => {
  const tenantIds: string[] = [];

  test.afterEach(async () => {
    if (!databaseUrl) return;

    await getTestPrisma().tenant.deleteMany({
      where: { id: { in: tenantIds.splice(0) } },
    });
  });

  test.afterAll(async () => {
    await prisma?.$disconnect();
  });

  test('keeps GET /api/items and upsertItemAction scoped to the authenticated tenant', async ({
    request,
  }) => {
    test.skip(!databaseUrl, 'Missing DATABASE_URL or DIRECT_URL for E2E tenant isolation test.');

    const db = getTestPrisma();
    const tenantAId = randomUUID();
    const tenantBId = randomUUID();
    const tenantSuffix = randomUUID().slice(0, 8);
    tenantIds.push(tenantAId, tenantBId);

    const itemAId = randomUUID();
    const itemBId = randomUUID();

    await db.tenant.createMany({
      data: [
        {
          id: tenantAId,
          slug: `tenant-a-${tenantSuffix}`,
          name: 'Tenant A',
          currency: 'MXN',
        },
        {
          id: tenantBId,
          slug: `tenant-b-${tenantSuffix}`,
          name: 'Tenant B',
          currency: 'MXN',
        },
      ],
    });

    await db.menuItem.createMany({
      data: [
        {
          id: itemAId,
          tenantId: tenantAId,
          name: 'Tenant A taco',
          priceCents: 12000,
          currency: 'MXN',
        },
        {
          id: itemBId,
          tenantId: tenantBId,
          name: 'Tenant B ramen',
          priceCents: 18000,
          currency: 'MXN',
        },
      ],
    });

    const itemsResponse = await request.get('/api/items', {
      headers: { cookie: authCookie(tenantAId) },
    });
    expect(itemsResponse.ok()).toBe(true);

    const itemNames = ((await itemsResponse.json()) as Array<{ name: string }>).map((item) => item.name);
    expect(itemNames).toContain('Tenant A taco');
    expect(itemNames).not.toContain('Tenant B ramen');

    const crossTenantWrite = await request.post('/api/e2e/upsert-item-action', {
      headers: { cookie: authCookie(tenantAId) },
      data: {
        id: itemBId,
        categoryId: null,
        name: 'Tenant A overwrite attempt',
        description: null,
        priceCents: 9900,
        currency: 'MXN',
        imageUrl: null,
        isAvailable: true,
      },
    });

    expect(crossTenantWrite.status()).toBe(404);

    const tenantBItem = await db.menuItem.findUniqueOrThrow({ where: { id: itemBId } });
    expect(tenantBItem.tenantId).toBe(tenantBId);
    expect(tenantBItem.name).toBe('Tenant B ramen');
    expect(tenantBItem.priceCents).toBe(18000);
  });
});
