import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@supabase/supabase-js';
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

export type HistoryActor = {
  id: string | null;
  email: string | null;
  // Always renderable: email when resolvable, else a short actor id, else 'Sistema'.
  label: string;
};

export type MenuHistoryEntry = {
  id: string;
  action: MenuAuditAction;
  entityType: MenuAuditEntity;
  entityId: string | null;
  name: string | null;
  actor: HistoryActor;
  createdAt: Date;
};

export type MenuHistoryFilter = {
  // Restrict to one editorial entity type. Any value outside the allowlist is
  // ignored and falls back to all editorial types — never widens the scope.
  entityType?: MenuAuditEntity;
  limit?: number;
};

function extractName(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = (metadata as Record<string, unknown>).name;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function shortActorId(actorUserId: string): string {
  return actorUserId.length > 8 ? `${actorUserId.slice(0, 8)}…` : actorUserId;
}

/**
 * Resolves actor user ids to emails via the Supabase admin API (same approach
 * billing already uses). Best-effort: missing service-role config or a failed
 * lookup yields an empty map, and callers fall back to a short actor id.
 */
async function resolveActorEmails(actorIds: string[]): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  const uniqueIds = [...new Set(actorIds)];
  if (uniqueIds.length === 0) return emails;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return emails;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const { data, error } = await supabase.auth.admin.getUserById(id);
        if (!error && data.user?.email) emails.set(id, data.user.email);
      } catch (error) {
        Sentry.captureException(error, { tags: { scope: 'audit.resolveActorEmails' } });
      }
    }),
  );

  return emails;
}

function toActor(actorUserId: string | null, emails: Map<string, string>): HistoryActor {
  if (!actorUserId) return { id: null, email: null, label: 'Sistema' };
  const email = emails.get(actorUserId) ?? null;
  return { id: actorUserId, email, label: email ?? shortActorId(actorUserId) };
}

/**
 * Reads the tenant's editorial history (menu events only). Tenant-scoped by
 * design; system/auth/billing events are excluded via the entity-type filter.
 * Optionally narrows to a single editorial entity type.
 */
export async function listMenuHistory(
  tenantId: string,
  filter: MenuHistoryFilter = {},
): Promise<MenuHistoryEntry[]> {
  if (process.env.USE_MOCKS === 'true') return [];

  const entityTypeWhere =
    filter.entityType && MENU_AUDIT_ENTITY_TYPES.includes(filter.entityType)
      ? filter.entityType
      : { in: [...MENU_AUDIT_ENTITY_TYPES] };

  const rows = await getPrisma().auditLog.findMany({
    where: {
      tenantId,
      entityType: entityTypeWhere,
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    take: filter.limit ?? 50,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      actorUserId: true,
      metadata: true,
      createdAt: true,
    },
  });

  const emails = await resolveActorEmails(
    rows.map((row) => row.actorUserId).filter((id): id is string => id !== null),
  );

  return rows.map((row) => ({
    id: row.id,
    action: row.action as MenuAuditAction,
    entityType: row.entityType as MenuAuditEntity,
    entityId: row.entityId,
    name: extractName(row.metadata),
    actor: toActor(row.actorUserId, emails),
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
