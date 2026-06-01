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

function authCookie(tenantId: string, userId: string) {
  return `e2e_tenant_id=${tenantId}; e2e_user_id=${userId}`;
}

type TenantIsolationFixture = {
  tenantAId: string;
  tenantBId: string;
  tenantASlug: string;
  tenantBSlug: string;
  userAId: string;
  userBId: string;
  itemAId: string;
  itemBId: string;
};

async function createTenantIsolationFixture(): Promise<TenantIsolationFixture> {
  const db = getTestPrisma();
  const tenantAId = randomUUID();
  const tenantBId = randomUUID();
  const userAId = randomUUID();
  const userBId = randomUUID();
  const tenantSuffix = randomUUID().slice(0, 8);
  const tenantASlug = `tenant-a-${tenantSuffix}`;
  const tenantBSlug = `tenant-b-${tenantSuffix}`;
  const itemAId = randomUUID();
  const itemBId = randomUUID();

  await db.tenant.createMany({
    data: [
      {
        id: tenantAId,
        slug: tenantASlug,
        name: 'Tenant A',
        currency: 'MXN',
      },
      {
        id: tenantBId,
        slug: tenantBSlug,
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

  await db.membership.createMany({
    data: [
      {
        tenantId: tenantAId,
        userId: userAId,
        role: 'owner',
      },
      {
        tenantId: tenantBId,
        userId: userBId,
        role: 'owner',
      },
    ],
  });

  return {
    tenantAId,
    tenantBId,
    tenantASlug,
    tenantBSlug,
    userAId,
    userBId,
    itemAId,
    itemBId,
  };
}

test.describe('tenant isolation', () => {
  test.describe.configure({ mode: 'serial' });

  let fixture: TenantIsolationFixture;

  test.beforeEach(async () => {
    test.skip(!databaseUrl, 'Missing DATABASE_URL or DIRECT_URL for E2E tenant isolation test.');
    fixture = await createTenantIsolationFixture();
  });

  test.afterEach(async () => {
    if (!databaseUrl || !fixture) return;

    const db = getTestPrisma();
    await db.auditLog.deleteMany({
      where: {
        OR: [
          { tenantId: { in: [fixture.tenantAId, fixture.tenantBId] } },
          { actorUserId: { in: [fixture.userAId, fixture.userBId] } },
        ],
      },
    });
    await db.tenant.deleteMany({
      where: { id: { in: [fixture.tenantAId, fixture.tenantBId] } },
    });
  });

  test.afterAll(async () => {
    await prisma?.$disconnect();
  });

  test('tenant A cannot see tenant B items via admin menu', async ({ request }) => {
    const menuResponse = await request.get('/menu', {
      headers: { cookie: authCookie(fixture.tenantAId, fixture.userAId) },
    });
    expect(menuResponse.ok()).toBe(true);
    const menuHtml = await menuResponse.text();
    expect(menuHtml).toContain('Tenant A taco');
    expect(menuHtml).not.toContain('Tenant B ramen');

    const forgedTenantAccess = await request.get('/menu', {
      headers: { cookie: authCookie(fixture.tenantBId, fixture.userAId) },
    });
    expect(forgedTenantAccess.ok()).toBe(true);
    const forgedMenuHtml = await forgedTenantAccess.text();
    expect(forgedMenuHtml).toContain('Tenant A taco');
    expect(forgedMenuHtml).not.toContain('Tenant B ramen');

    const invalidCookieAudit = await getTestPrisma().auditLog.findFirst({
      where: {
        actorUserId: fixture.userAId,
        action: 'auth.invalid_tenant_cookie',
        entityId: fixture.tenantBId,
      },
    });
    expect(invalidCookieAudit).not.toBeNull();
  });

  test('tenant A cannot mutate tenant B items via Server Action', async ({ request }) => {
    const crossTenantWrite = await request.post('/api/e2e/upsert-item-action', {
      headers: { cookie: authCookie(fixture.tenantAId, fixture.userAId) },
      data: {
        id: fixture.itemBId,
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

    const tenantBItem = await getTestPrisma().menuItem.findUniqueOrThrow({ where: { id: fixture.itemBId } });
    expect(tenantBItem.tenantId).toBe(fixture.tenantBId);
    expect(tenantBItem.name).toBe('Tenant B ramen');
    expect(tenantBItem.priceCents).toBe(18000);
  });

  test('public /m/[slug] view is isolated by slug', async ({ request }) => {
    const tenantAPage = await request.get(`/m/${fixture.tenantASlug}`);
    expect(tenantAPage.ok()).toBe(true);
    const tenantAHtml = await tenantAPage.text();
    expect(tenantAHtml).toContain('Tenant A taco');
    expect(tenantAHtml).not.toContain('Tenant B ramen');

    const tenantBPage = await request.get(`/m/${fixture.tenantBSlug}`);
    expect(tenantBPage.ok()).toBe(true);
    const tenantBHtml = await tenantBPage.text();
    expect(tenantBHtml).toContain('Tenant B ramen');
    expect(tenantBHtml).not.toContain('Tenant A taco');
  });

  test('audit log: invalid cookie attempt is written to actor tenant, not the forged tenant', async ({
    request,
  }) => {
    // User A forges tenant B cookie — requireAuth rejects and falls back to tenant A.
    // The audit log entry must be scoped to tenant A (the real tenant), not tenant B.
    await request.get('/menu', {
      headers: { cookie: authCookie(fixture.tenantBId, fixture.userAId) },
    });

    const db = getTestPrisma();

    const entryOnActorTenant = await db.auditLog.findFirst({
      where: {
        tenantId: fixture.tenantAId,
        actorUserId: fixture.userAId,
        action: 'auth.invalid_tenant_cookie',
        entityId: fixture.tenantBId,
      },
    });
    expect(entryOnActorTenant).not.toBeNull();

    // The audit entry must NOT be attributed to tenant B's scope.
    const entryOnForgedTenant = await db.auditLog.findFirst({
      where: {
        tenantId: fixture.tenantBId,
        actorUserId: fixture.userAId,
        action: 'auth.invalid_tenant_cookie',
      },
    });
    expect(entryOnForgedTenant).toBeNull();
  });

  test('menu_views: tracking write is scoped to correct tenant via slug', async ({ request }) => {
    const db = getTestPrisma();

    const beforeCount = await db.menuView.count({ where: { tenantId: fixture.tenantAId } });

    // Track a view for tenant A's menu via slug
    await request.post('/api/track/view', {
      data: { slug: fixture.tenantASlug, sessionId: randomUUID() },
    });

    const afterCount = await db.menuView.count({ where: { tenantId: fixture.tenantAId } });
    expect(afterCount).toBe(beforeCount + 1);

    // Tenant B's view count must not be affected
    const tenantBViews = await db.menuView.count({ where: { tenantId: fixture.tenantBId } });
    expect(tenantBViews).toBe(0);
  });

  test('menu_views: tracking ignores non-existent tenant slug', async ({ request }) => {
    const res = await request.post('/api/track/view', {
      data: { slug: 'does-not-exist-ever', sessionId: randomUUID() },
    });
    // Should return 404 or error — must not create an orphaned view row
    expect(res.ok()).toBe(false);
  });
});
