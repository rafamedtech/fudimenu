import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  auditLogFindMany: vi.fn(),
  menuItemFindMany: vi.fn(),
  captureException: vi.fn(),
  getUserById: vi.fn(),
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

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { admin: { getUserById: mocks.getUserById } },
  })),
}));

const originalUseMocks = process.env.USE_MOCKS;
const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
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
    const sampleRow = {
      id: 'a',
      action: 'item.updated',
      entityType: 'menu_item',
      entityId: 'item-1',
      actorUserId: 'user-9',
      metadata: { name: 'Pozole', priceCents: 5000 },
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
    };

    it('scopes to the tenant and to menu entity types only (no auth/billing/system events)', async () => {
      mocks.auditLogFindMany.mockResolvedValueOnce([sampleRow]);

      const { listMenuHistory } = await load();
      const result = await listMenuHistory('tenant-1');

      const where = mocks.auditLogFindMany.mock.calls[0][0].where;
      expect(where.tenantId).toBe('tenant-1');
      expect(where.entityType).toEqual({ in: ['menu_item', 'section', 'category'] });
      expect(result[0]).toMatchObject({ id: 'a', action: 'item.updated', name: 'Pozole' });
    });

    it('narrows to a single entity type when filtered, staying tenant-scoped', async () => {
      mocks.auditLogFindMany.mockResolvedValueOnce([]);

      const { listMenuHistory } = await load();
      await listMenuHistory('tenant-1', { entityType: 'section' });

      const where = mocks.auditLogFindMany.mock.calls[0][0].where;
      expect(where.tenantId).toBe('tenant-1');
      expect(where.entityType).toBe('section');
    });

    it('resolves actor email via the user source when service-role config is present', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
      mocks.auditLogFindMany.mockResolvedValueOnce([sampleRow]);
      mocks.getUserById.mockResolvedValueOnce({
        data: { user: { email: 'chef@fudimenu.test' } },
        error: null,
      });

      const { listMenuHistory } = await load();
      const result = await listMenuHistory('tenant-1');

      expect(result[0].actor).toEqual({
        id: 'user-9',
        email: 'chef@fudimenu.test',
        label: 'chef@fudimenu.test',
      });
    });

    it('falls back to a short actor id when no email is resolvable', async () => {
      // No service-role env → no lookup; actor still shown via its id.
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      mocks.auditLogFindMany.mockResolvedValueOnce([
        { ...sampleRow, actorUserId: 'abcdef12-3456-7890' },
      ]);

      const { listMenuHistory } = await load();
      const result = await listMenuHistory('tenant-1');

      expect(mocks.getUserById).not.toHaveBeenCalled();
      expect(result[0].actor).toEqual({
        id: 'abcdef12-3456-7890',
        email: null,
        label: 'abcdef12…',
      });
    });

    it('labels a missing actor as Sistema', async () => {
      mocks.auditLogFindMany.mockResolvedValueOnce([{ ...sampleRow, actorUserId: null }]);

      const { listMenuHistory } = await load();
      const result = await listMenuHistory('tenant-1');

      expect(result[0].actor.label).toBe('Sistema');
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
