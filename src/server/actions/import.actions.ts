'use server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { PLAN_CONFIG } from '@/config/plans';
import { checkRateLimit } from '@/lib/ratelimit';
import { type ImportRowError } from '@/lib/import/menu-import';
import {
  MAX_IMPORT_ROWS,
  importPayloadSchema,
  type ImportItem,
} from '@/lib/validators/import.schema';
import { requireAuth, type AuthContext } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';
import type { ImportResult } from '@/server/repositories/menu.repository';

type ImportActionResult =
  | { ok: true; result: ImportResult }
  | { ok: false; code: 'unauthorized' | 'rate_limited' | 'too_large' | 'plan_limit_reached' }
  | { ok: false; code: 'validation'; errors: ImportRowError[] };

function isRedirectError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof error.digest === 'string' &&
    error.digest.startsWith('NEXT_REDIRECT;')
  );
}

async function requireActionAuth(): Promise<AuthContext | { ok: false; code: 'unauthorized' }> {
  try {
    return await requireAuth();
  } catch (error) {
    if (isRedirectError(error)) return { ok: false, code: 'unauthorized' };
    throw error;
  }
}

function revalidateMenu(ctx: AuthContext) {
  revalidateTag(`menu:${ctx.tenantId}`);
  revalidateTag(`tenant:${ctx.tenantId}`);
  revalidatePath('/menu');
  revalidatePath('/dashboard');

  const active = ctx.memberships.find((membership) => membership.tenantId === ctx.tenantId);
  if (active) revalidatePath(`/m/${active.tenant.slug}`);
}

/**
 * Persist the rows the user confirmed in the preview. Parsing and editing happen
 * client-side (nothing is written until this call). The action re-validates the
 * full payload against `importPayloadSchema` — edited rows are never trusted
 * blindly — applies rate limit + plan limits, and scopes the write to
 * `ctx.tenantId` (tenant isolation). Invalid CSV rows are filtered out on the
 * client before confirmation and reported there as skipped.
 */
export async function importMenuAction(input: { rows: ImportItem[] }): Promise<ImportActionResult> {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  const limit = await checkRateLimit(ctx.tenantId, {
    identifier: 'menu-import',
    requests: 10,
    windowSec: 60,
  });
  if (!limit.allowed) return { ok: false, code: 'rate_limited' };

  // Reject oversized payloads before the per-row pass so a huge array can't be
  // walked field by field.
  if (Array.isArray(input?.rows) && input.rows.length > MAX_IMPORT_ROWS) {
    return { ok: false, code: 'too_large' };
  }

  const parsed = importPayloadSchema.safeParse(input);
  if (!parsed.success) {
    const errors: ImportRowError[] = parsed.error.issues.map((issue) => {
      // issue.path = ['rows', <index>, <field>]; surface as a 1-based row number.
      const index = typeof issue.path[1] === 'number' ? issue.path[1] : -1;
      return {
        rowNumber: index + 1,
        field: String(issue.path[2] ?? 'row'),
        message: issue.message,
      };
    });
    return { ok: false, code: 'validation', errors };
  }

  const rows = parsed.data.rows;

  // Plan validation against the FINAL confirmed row count + brand-new sections.
  const limits = PLAN_CONFIG[ctx.plan].limits;
  if (limits.items !== null || limits.sections !== null) {
    const { items, sections } = await menuService.getMenuByTenantId(ctx.tenantId);

    if (limits.items !== null && items.length + rows.length > limits.items) {
      return { ok: false, code: 'plan_limit_reached' };
    }

    if (limits.sections !== null) {
      const existingSectionNames = new Set(sections.map((section) => section.name));
      const newSectionNames = new Set(
        rows
          .map((row) => row.sectionName)
          .filter((name): name is string => Boolean(name) && !existingSectionNames.has(name as string)),
      );
      if (existingSectionNames.size + newSectionNames.size > limits.sections) {
        return { ok: false, code: 'plan_limit_reached' };
      }
    }
  }

  const result = await menuService.importMenu(ctx.tenantId, rows);
  revalidateMenu(ctx);
  return { ok: true, result };
}
