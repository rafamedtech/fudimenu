import 'server-only';
import * as Sentry from '@sentry/nextjs';
import type { Prisma } from '@/generated/prisma/client';
import { getPrisma } from '@/lib/db/prisma';
import type { AuthContext } from '@/server/guards/require-auth';

// Editorial history covers menu changes only. Auth/billing/system events use
// their own actions and entity types and are intentionally excluded here.
export const MENU_AUDIT_ENTITY_TYPES = ['menu_item', 'section', 'category'] as const;
export type MenuAuditEntity = (typeof MENU_AUDIT_ENTITY_TYPES)[number];

export type MenuAuditAction =
  | 'item.created'
  | 'item.updated'
  | 'item.deleted'
  | 'item.restored'
  | 'item.availability_changed'
  | 'item.special_changed'
  | 'section.created'
  | 'section.updated'
  | 'section.deleted'
  | 'section.reordered'
  | 'category.created'
  | 'category.updated'
  | 'category.deleted'
  | 'category.reordered';

type RecordInput = {
  action: MenuAuditAction;
  entityType: MenuAuditEntity;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Best-effort editorial audit write. Tenant isolation is enforced by always
 * deriving tenantId/actorUserId from the authenticated context — never the
 * caller's input. Failures never break the underlying mutation: a dropped
 * audit row must not block a menu edit.
 */
export async function recordMenuEvent(
  ctx: Pick<AuthContext, 'tenantId' | 'userId'>,
  input: RecordInput,
): Promise<void> {
  // No DB in mock dev mode; skip rather than throw.
  if (process.env.USE_MOCKS === 'true') return;

  try {
    await getPrisma().auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? {},
      },
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { scope: 'audit.recordMenuEvent', action: input.action },
    });
  }
}

export type MenuHistoryEntry = {
  id: string;
  action: MenuAuditAction;
  entityType: MenuAuditEntity;
  entityId: string | null;
  name: string | null;
  createdAt: Date;
};

function extractName(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = (metadata as Record<string, unknown>).name;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Reads the tenant's editorial history (menu events only). Tenant-scoped by
 * design; system/auth/billing events are excluded via the entity-type filter.
 */
export async function listMenuHistory(
  tenantId: string,
  limit = 50,
): Promise<MenuHistoryEntry[]> {
  if (process.env.USE_MOCKS === 'true') return [];

  const rows = await getPrisma().auditLog.findMany({
    where: {
      tenantId,
      entityType: { in: [...MENU_AUDIT_ENTITY_TYPES] },
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    action: row.action as MenuAuditAction,
    entityType: row.entityType as MenuAuditEntity,
    entityId: row.entityId,
    name: extractName(row.metadata),
    createdAt: row.createdAt,
  }));
}

/**
 * IDs of currently soft-deleted items for the tenant, so the history view only
 * offers "restore" on delete events that are still undoable.
 */
export async function listRestorableItemIds(tenantId: string): Promise<Set<string>> {
  if (process.env.USE_MOCKS === 'true') return new Set();

  const rows = await getPrisma().menuItem.findMany({
    where: { tenantId, deletedAt: { not: null } },
    select: { id: true },
  });
  return new Set(rows.map((row) => row.id));
}
