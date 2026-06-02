import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

let prisma: PrismaClient | null = null;

function getTestPrisma() {
  if (!databaseUrl) throw new Error('Missing DATABASE_URL or DIRECT_URL for E2E privacy test.');
  prisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
  return prisma;
}

function authCookie(tenantId: string, userId: string) {
  return `e2e_tenant_id=${tenantId}; e2e_user_id=${userId}`;
}

test.describe('privacy: export and delete', () => {
  const cleanupTenantIds: string[] = [];

  test.afterEach(async () => {
    if (!databaseUrl || cleanupTenantIds.length === 0) return;
    await getTestPrisma().tenant.deleteMany({
      where: { id: { in: cleanupTenantIds.splice(0) } },
    });
  });

  test.afterAll(async () => {
    await prisma?.$disconnect();
  });

  test('owner can export account data as JSON', async ({ request }) => {
    test.skip(!databaseUrl, 'Missing DATABASE_URL for E2E privacy test.');

    const db = getTestPrisma();
    const tenantId = randomUUID();
    const userId = randomUUID();
    const slug = `privacy-export-${randomUUID().slice(0, 8)}`;

    await db.tenant.create({
      data: { id: tenantId, slug, name: 'Privacy Export Test', currency: 'MXN' },
    });
    await db.membership.create({
      data: { tenantId, userId, role: 'owner' },
    });
    cleanupTenantIds.push(tenantId);

    const res = await request.post('/api/account/export', {
      headers: { cookie: authCookie(tenantId, userId) },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('tenant');
    expect(body).toHaveProperty('items');
    expect(body).not.toHaveProperty('password');
  });

  test('non-owner cannot delete account', async ({ request }) => {
    test.skip(!databaseUrl, 'Missing DATABASE_URL for E2E privacy test.');

    const db = getTestPrisma();
    const tenantId = randomUUID();
    const userId = randomUUID();
    const slug = `privacy-nodelete-${randomUUID().slice(0, 8)}`;

    await db.tenant.create({
      data: { id: tenantId, slug, name: 'No Delete Test', currency: 'MXN' },
    });
    await db.membership.create({
      data: { tenantId, userId, role: 'staff' },
    });
    cleanupTenantIds.push(tenantId);

    const res = await request.delete('/api/account/delete', {
      headers: {
        cookie: authCookie(tenantId, userId),
        'x-delete-token': 'any-token',
      },
    });

    expect(res.status()).toBe(403);
  });

  test('owner delete without valid OTP is rejected', async ({ request }) => {
    test.skip(!databaseUrl, 'Missing DATABASE_URL for E2E privacy test.');

    const db = getTestPrisma();
    const tenantId = randomUUID();
    const userId = randomUUID();
    const slug = `privacy-otp-${randomUUID().slice(0, 8)}`;

    await db.tenant.create({
      data: { id: tenantId, slug, name: 'OTP Delete Test', currency: 'MXN' },
    });
    await db.membership.create({
      data: { tenantId, userId, role: 'owner' },
    });
    cleanupTenantIds.push(tenantId);

    const res = await request.delete('/api/account/delete', {
      headers: {
        cookie: authCookie(tenantId, userId),
        'x-delete-token': 'invalid-token',
      },
    });

    expect([400, 422]).toContain(res.status());
  });
});
