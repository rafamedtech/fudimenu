import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { hashDeleteToken } from '../../src/server/services/account-delete-otp.service';

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(async () => ({
    userId: '00000000-0000-0000-0000-000000000001',
    email: 'owner@example.com',
    tenantId: '00000000-0000-0000-0000-000000000010',
    plan: 'pro',
    role: 'owner',
    memberships: [],
  })),
  tenantFindUnique: vi.fn(),
  accountDeleteRequestFindMany: vi.fn(),
  accountDeleteRequestUpdateMany: vi.fn(),
  tenantUpdate: vi.fn(),
  membershipUpdateMany: vi.fn(),
  menuItemUpdateMany: vi.fn(),
  auditLogCreate: vi.fn(),
  transaction: vi.fn(async (operations) => Promise.all(operations)),
  cancelSubscriptionsForTenant: vi.fn(async () => ({
    stripeEnabled: false,
    checked: 0,
    canceled: 0,
  })),
  sendAccountDeletionEmail: vi.fn(async () => ({
    sent: false,
    reason: 'missing_resend_api_key',
  })),
}));

vi.mock('@/server/guards/require-auth', () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: vi.fn(() => ({
    tenant: {
      findUnique: mocks.tenantFindUnique,
      update: mocks.tenantUpdate,
    },
    accountDeleteRequest: {
      findMany: mocks.accountDeleteRequestFindMany,
      updateMany: mocks.accountDeleteRequestUpdateMany,
    },
    membership: {
      updateMany: mocks.membershipUpdateMany,
    },
    menuItem: {
      updateMany: mocks.menuItemUpdateMany,
    },
    auditLog: {
      create: mocks.auditLogCreate,
    },
    $transaction: mocks.transaction,
  })),
}));

vi.mock('@/server/services/billing.service', () => ({
  billingService: {
    cancelSubscriptionsForTenant: mocks.cancelSubscriptionsForTenant,
    sendAccountDeletionEmail: mocks.sendAccountDeletionEmail,
  },
}));

function deleteRequest(token = '123456') {
  return new NextRequest('http://localhost/api/account/delete', {
    method: 'DELETE',
    headers: { 'x-delete-token': token },
  });
}

describe('account delete OTP', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  async function loadDeleteRoute() {
    const mod = await import('../../src/app/api/account/delete/route');
    return mod.DELETE;
  }

  function mockExistingTenant() {
    mocks.tenantFindUnique.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000010',
      name: 'Taqueria Norte',
      deletedAt: null,
    });
  }

  it('rejects expired tokens', async () => {
    mockExistingTenant();
    mocks.accountDeleteRequestFindMany.mockResolvedValue([]);

    const DELETE = await loadDeleteRoute();
    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: 'invalid_token' });
    expect(mocks.accountDeleteRequestUpdateMany).not.toHaveBeenCalled();
  });

  it('rejects reused tokens', async () => {
    mockExistingTenant();
    mocks.accountDeleteRequestFindMany.mockResolvedValue([
      { id: 'delete-request-1', codeHash: await hashDeleteToken('123456') },
    ]);
    mocks.accountDeleteRequestUpdateMany.mockResolvedValue({ count: 0 });

    const DELETE = await loadDeleteRoute();
    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: 'invalid_token' });
  });

  it('rejects incorrect tokens', async () => {
    mockExistingTenant();
    mocks.accountDeleteRequestFindMany.mockResolvedValue([
      { id: 'delete-request-1', codeHash: await hashDeleteToken('123456') },
    ]);

    const DELETE = await loadDeleteRoute();
    const response = await DELETE(deleteRequest('654321'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: 'invalid_token' });
    expect(mocks.accountDeleteRequestUpdateMany).not.toHaveBeenCalled();
  });

  it('consumes a valid token once and soft deletes the account', async () => {
    mockExistingTenant();
    mocks.accountDeleteRequestFindMany.mockResolvedValue([
      { id: 'delete-request-1', codeHash: await hashDeleteToken('123456') },
    ]);
    mocks.accountDeleteRequestUpdateMany.mockResolvedValue({ count: 1 });
    mocks.tenantUpdate.mockResolvedValue({ id: '00000000-0000-0000-0000-000000000010' });
    mocks.membershipUpdateMany.mockResolvedValue({ count: 2 });
    mocks.menuItemUpdateMany.mockResolvedValue({ count: 7 });
    mocks.auditLogCreate.mockResolvedValue({ id: 'audit-1' });

    const DELETE = await loadDeleteRoute();
    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      softDeleted: { tenant: true, memberships: 2, items: 7 },
    });
    expect(mocks.accountDeleteRequestUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'delete-request-1',
          consumedAt: null,
        }),
      }),
    );
    expect(mocks.tenantUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '00000000-0000-0000-0000-000000000010' },
      }),
    );
  });
});
