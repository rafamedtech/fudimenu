import { afterEach, describe, expect, it, vi } from 'vitest';

const mockCtx = {
  userId: 'user-1',
  email: 'owner@example.com',
  tenantId: 'tenant-1',
  plan: 'pro',
  role: 'owner',
  memberships: [
    {
      tenantId: 'tenant-1',
      role: 'owner',
      tenant: { name: 'Taqueria Norte', slug: 'taqueria-norte', plan: 'pro' },
    },
  ],
};

const mockSection = {
  id: 'section-1',
  tenantId: 'tenant-1',
  name: 'Entradas',
  coverImageUrl: null,
  accentColor: '#FFF8E7',
  sortOrder: 0,
  isVisible: true,
  createdAt: new Date().toISOString(),
};

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  requireAuth: vi.fn(async () => mockCtx),
  upsertSection: vi.fn(),
  deleteSection: vi.fn(),
  reorderSections: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/ratelimit', () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock('@/server/guards/require-auth', () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock('@/server/services/menu.service', () => ({
  menuService: {
    upsertSection: mocks.upsertSection,
    deleteSection: mocks.deleteSection,
    reorderSections: mocks.reorderSections,
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}));

async function loadSectionsActions() {
  return import('../../src/server/actions/sections.actions');
}

describe('sections actions', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('upsertSectionAction', () => {
    it('returns unauthorized when requireAuth throws redirect', async () => {
      mocks.requireAuth.mockRejectedValueOnce(
        Object.assign(new Error('redirect'), {
          digest: 'NEXT_REDIRECT;replace;/login;307;',
        }),
      );

      const { upsertSectionAction } = await loadSectionsActions();
      const result = await upsertSectionAction({ name: 'Entradas' });

      expect(result).toEqual({ ok: false, code: 'unauthorized', error: undefined });
      expect(mocks.upsertSection).not.toHaveBeenCalled();
    });

    it('returns rate_limited when limit exceeded', async () => {
      mocks.checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetSec: 60 });

      const { upsertSectionAction } = await loadSectionsActions();
      const result = await upsertSectionAction({ name: 'Entradas' });

      expect(result).toEqual({ ok: false, code: 'rate_limited', error: undefined });
      expect(mocks.upsertSection).not.toHaveBeenCalled();
    });

    it('returns validation error for invalid input', async () => {
      mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 59, resetSec: 60 });

      const { upsertSectionAction } = await loadSectionsActions();
      const result = await upsertSectionAction({ name: '' });

      expect(result.ok).toBe(false);
      expect((result as { ok: false; code: string }).code).toBe('validation');
      expect(mocks.upsertSection).not.toHaveBeenCalled();
    });

    it('returns ok with section on valid input', async () => {
      mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 59, resetSec: 60 });
      mocks.upsertSection.mockResolvedValue(mockSection);

      const { upsertSectionAction } = await loadSectionsActions();
      const result = await upsertSectionAction({ name: 'Entradas' });

      expect(result).toEqual({ ok: true, section: mockSection });
      expect(mocks.upsertSection).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ name: 'Entradas' }));
      expect(mocks.revalidateTag).toHaveBeenCalledWith('menu:tenant-1');
    });
  });

  describe('softDeleteSectionAction', () => {
    it('returns not_found when service throws not_found', async () => {
      mocks.deleteSection.mockRejectedValueOnce(new Error('not_found'));

      const { softDeleteSectionAction } = await loadSectionsActions();
      const result = await softDeleteSectionAction('section-99');

      expect(result).toEqual({ ok: false, code: 'not_found', error: undefined });
    });

    it('returns ok on successful delete', async () => {
      mocks.deleteSection.mockResolvedValue(undefined);

      const { softDeleteSectionAction } = await loadSectionsActions();
      const result = await softDeleteSectionAction('section-1');

      expect(result).toEqual({ ok: true });
      expect(mocks.deleteSection).toHaveBeenCalledWith('tenant-1', 'section-1');
    });
  });

  describe('reorderSectionsAction', () => {
    it('reorders sections and revalidates cache', async () => {
      mocks.reorderSections.mockResolvedValue(undefined);

      const { reorderSectionsAction } = await loadSectionsActions();
      const ids = ['section-2', 'section-1', 'section-3'];
      const result = await reorderSectionsAction({ sectionIds: ids });

      expect(result).toEqual({ ok: true });
      expect(mocks.reorderSections).toHaveBeenCalledWith('tenant-1', ids);
      expect(mocks.revalidateTag).toHaveBeenCalledWith('menu:tenant-1');
    });

    it('returns validation error for empty sectionIds', async () => {
      const { reorderSectionsAction } = await loadSectionsActions();
      const result = await reorderSectionsAction({ sectionIds: [] });

      expect(result.ok).toBe(false);
      expect((result as { ok: false; code: string }).code).toBe('validation');
      expect(mocks.reorderSections).not.toHaveBeenCalled();
    });
  });
});
