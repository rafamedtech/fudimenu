import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tenantCount: vi.fn(),
  menuItemCount: vi.fn(),
  tenantDeleteMany: vi.fn(),
  menuItemDeleteMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: vi.fn(() => ({
    tenant: {
      count: mocks.tenantCount,
      deleteMany: mocks.tenantDeleteMany,
    },
    menuItem: {
      count: mocks.menuItemCount,
      deleteMany: mocks.menuItemDeleteMany,
    },
    $transaction: mocks.transaction,
  })),
}));

const originalCronSecret = process.env.CRON_SECRET;
const now = new Date('2026-05-07T12:00:00.000Z');

function cronRequest(path = '/api/cron/cleanup', authorization = 'Bearer cron-secret') {
  return new Request(`https://app.fudimenu.test${path}`, {
    headers: authorization ? { authorization } : {},
  });
}

async function loadRoute() {
  const mod = await import('../../src/app/api/cron/cleanup/route');
  return mod.GET;
}

describe('cleanup cron', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'cron-secret';
    vi.spyOn(Date, 'now').mockReturnValue(now.getTime());
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns 401 without the correct Authorization header', async () => {
    const GET = await loadRoute();
    const response = await GET(cronRequest('/api/cron/cleanup', 'Bearer wrong'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false, error: 'Unauthorized' });
    expect(mocks.tenantCount).not.toHaveBeenCalled();
  });

  it('dryRun returns counts without deleting rows', async () => {
    mocks.tenantCount.mockResolvedValue(2);
    mocks.menuItemCount.mockResolvedValue(5);

    const GET = await loadRoute();
    const response = await GET(cronRequest('/api/cron/cleanup?dryRun=1'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      dryRun: true,
      wouldDeleteTenants: 2,
      wouldDeleteItems: 5,
      cutoff: '2026-04-07T12:00:00.000Z',
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.tenantDeleteMany).not.toHaveBeenCalled();
    expect(mocks.menuItemDeleteMany).not.toHaveBeenCalled();
  });
});
