import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  auditLogFindMany: vi.fn(),
  menuItemFindMany: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: vi.fn(() => ({
    auditLog: {
      create: mocks.auditLogCreate,
      findMany: mocks.auditLogFindMany,
    },
    menuItem: {
      findMany: mocks.menuItemFindMany,
    },
  })),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: mocks.captureException,
}));

const originalUseMocks = process.env.USE_MOCKS;

async function load() {
  return import('../../src/server/services/audit.service');
}

const ctx = { tenantId: 'tenant-1', userId: 'user-9' };

describe('audit.service', () => {
  beforeEach(() => {
    // Service skips writes in mock mode; force real-DB path for write assertions.
    process.env.USE_MOCKS = 'false';
  });

  afterEach(() => {
    process.env.USE_MOCKS = originalUseMocks;
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('recordMenuEvent', () => {
    it('derives tenantId and actorUserId from the auth context, never the caller', async () => {
      const { recordMenuEvent } = await load();

      await recordMenuEvent(ctx, {
        action: 'item.deleted',
        entityType: 'menu_item',
        entityId: 'item-7',
        metadata: { name: 'Tacos' },
      });

      // Isolation is the whole point: a leaked/forged tenantId in metadata must
      // not change the row's tenant — it always comes from ctx.
      expect(mocks.auditLogCreate).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          actorUserId: 'user-9',
          action: 'item.deleted',
          entityType: 'menu_item',
          entityId: 'item-7',
          metadata: { name: 'Tacos' },
        },
      });
    });

    it('does not touch the DB in mock mode', async () => {
      process.env.USE_MOCKS = 'true';
      const { recordMenuEvent } = await load();

      await recordMenuEvent(ctx, { action: 'item.created', entityType: 'menu_item', entityId: 'i' });

      expect(mocks.auditLogCreate).not.toHaveBeenCalled();
    });

    it('never throws when the audit write fails, so the mutation is not blocked', async () => {
      mocks.auditLogCreate.mockRejectedValueOnce(new Error('db down'));
      const { recordMenuEvent } = await load();

      await expect(
        recordMenuEvent(ctx, { action: 'item.created', entityType: 'menu_item', entityId: 'i' }),
      ).resolves.toBeUndefined();
      expect(mocks.captureException).toHaveBeenCalledOnce();
    });
  });

  describe('listMenuHistory', () => {
    it('scopes to the tenant and to menu entity types only (no auth/billing/system events)', async () => {
      mocks.auditLogFindMany.mockResolvedValueOnce([
        {
          id: 'a',
          action: 'item.updated',
          entityType: 'menu_item',
          entityId: 'item-1',
          metadata: { name: 'Pozole', priceCents: 5000 },
          createdAt: new Date('2026-06-01T00:00:00.000Z'),
        },
      ]);

      const { listMenuHistory } = await load();
      const result = await listMenuHistory('tenant-1');

      const where = mocks.auditLogFindMany.mock.calls[0][0].where;
      expect(where.tenantId).toBe('tenant-1');
      expect(where.entityType).toEqual({ in: ['menu_item', 'section', 'category'] });
      expect(result[0]).toMatchObject({ id: 'a', action: 'item.updated', name: 'Pozole' });
    });

    it('returns empty without hitting the DB in mock mode', async () => {
      process.env.USE_MOCKS = 'true';
      const { listMenuHistory } = await load();

      expect(await listMenuHistory('tenant-1')).toEqual([]);
      expect(mocks.auditLogFindMany).not.toHaveBeenCalled();
    });
  });

  describe('listRestorableItemIds', () => {
    it('returns only currently soft-deleted item ids for the tenant', async () => {
      mocks.menuItemFindMany.mockResolvedValueOnce([{ id: 'd1' }, { id: 'd2' }]);
      const { listRestorableItemIds } = await load();

      const ids = await listRestorableItemIds('tenant-1');

      const where = mocks.menuItemFindMany.mock.calls[0][0].where;
      expect(where).toEqual({ tenantId: 'tenant-1', deletedAt: { not: null } });
      expect(ids).toEqual(new Set(['d1', 'd2']));
    });
  });
});
