import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type AuditLogRow = {
  id: string;
  createdAt: Date;
};

const mocks = vi.hoisted(() => ({
  auditLogCount: vi.fn(),
  auditLogCreate: vi.fn(),
  auditLogFindMany: vi.fn(),
  auditLogDeleteMany: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: vi.fn(() => ({
    auditLog: {
      count: mocks.auditLogCount,
      create: mocks.auditLogCreate,
      findMany: mocks.auditLogFindMany,
      deleteMany: mocks.auditLogDeleteMany,
    },
  })),
}));

const originalCronSecret = process.env.CRON_SECRET;
const now = new Date('2026-05-07T12:00:00.000Z');

function cronRequest(path = '/api/cron/audit-log-retention', authorization = 'Bearer cron-secret') {
  return new NextRequest(`https://app.fudimenu.test${path}`, {
    headers: authorization ? { authorization } : {},
  });
}

function installAuditLogStore(rows: AuditLogRow[]) {
  mocks.auditLogCount.mockImplementation(async ({ where }: { where: { createdAt: { lt: Date } } }) =>
    rows.filter((row) => row.createdAt < where.createdAt.lt).length,
  );
  mocks.auditLogCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
    const row = { id: `cron-log-${rows.length + 1}`, createdAt: now };
    rows.push(row);
    return { ...row, ...data };
  });
  mocks.auditLogFindMany.mockImplementation(
    async ({
      where,
      take,
    }: {
      where: { createdAt: { lt: Date } };
      take: number;
    }) =>
      rows
        .filter((row) => row.createdAt < where.createdAt.lt)
        .slice(0, take)
        .map((row) => ({ id: row.id })),
  );
  mocks.auditLogDeleteMany.mockImplementation(
    async ({ where }: { where: { id: { in: string[] } } }) => {
      const ids = new Set(where.id.in);
      const before = rows.length;
      for (let index = rows.length - 1; index >= 0; index -= 1) {
        if (ids.has(rows[index].id)) rows.splice(index, 1);
      }
      return { count: before - rows.length };
    },
  );
}

async function loadRoute() {
  const mod = await import('../../src/app/api/cron/audit-log-retention/route');
  return mod.GET;
}

describe('audit log retention cron', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'cron-secret';
    vi.spyOn(Date, 'now').mockReturnValue(now.getTime());
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns 401 without the correct Authorization header', async () => {
    installAuditLogStore([]);

    const GET = await loadRoute();
    const response = await GET(cronRequest('/api/cron/audit-log-retention', 'Bearer wrong'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false });
    expect(mocks.auditLogCount).not.toHaveBeenCalled();
  });

  it('does not delete and returns count for dryRun=1', async () => {
    const rows = [
      { id: 'old-1', createdAt: new Date('2026-01-01T00:00:00.000Z') },
      { id: 'recent-1', createdAt: new Date('2026-05-01T00:00:00.000Z') },
    ];
    installAuditLogStore(rows);

    const GET = await loadRoute();
    const response = await GET(cronRequest('/api/cron/audit-log-retention?dryRun=1'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      dryRun: true,
      wouldDelete: 1,
      cutoff: '2026-02-06T12:00:00.000Z',
    });
    expect(mocks.auditLogDeleteMany).not.toHaveBeenCalled();
    expect(mocks.auditLogCreate).not.toHaveBeenCalled();
    expect(rows.map((row) => row.id)).toEqual(['old-1', 'recent-1']);
  });

  it('deletes logs before cutoff and keeps recent logs', async () => {
    const rows = [
      { id: 'old-1', createdAt: new Date('2026-01-01T00:00:00.000Z') },
      { id: 'old-2', createdAt: new Date('2026-02-01T00:00:00.000Z') },
      { id: 'recent-1', createdAt: new Date('2026-05-01T00:00:00.000Z') },
    ];
    installAuditLogStore(rows);

    const GET = await loadRoute();
    const response = await GET(cronRequest());

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      deleted: 2,
      wouldDelete: 2,
      cutoff: '2026-02-06T12:00:00.000Z',
    });
    expect(rows.map((row) => row.id)).toEqual(['recent-1', 'cron-log-4']);
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: null,
        actorUserId: null,
        action: 'audit_log.retention',
        entityType: 'cron',
        entityId: null,
        metadata: expect.objectContaining({ wouldDelete: 2, batchSize: 1000 }),
      }),
    });
  });

  it('processes batch deletion for more than BATCH_SIZE rows', async () => {
    const rows = Array.from({ length: 1001 }, (_, index) => ({
      id: `old-${index}`,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }));
    rows.push({ id: 'recent-1', createdAt: new Date('2026-05-01T00:00:00.000Z') });
    installAuditLogStore(rows);

    const GET = await loadRoute();
    const response = await GET(cronRequest());

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      deleted: 1001,
      wouldDelete: 1001,
    });
    expect(mocks.auditLogFindMany).toHaveBeenCalledTimes(2);
    expect(mocks.auditLogDeleteMany).toHaveBeenCalledTimes(2);
    expect(rows.map((row) => row.id)).toEqual(['recent-1', 'cron-log-1003']);
  });
});
