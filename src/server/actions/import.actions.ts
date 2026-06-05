'use server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { PLAN_CONFIG } from '@/config/plans';
import { checkRateLimit } from '@/lib/ratelimit';
import { parseCsv } from '@/lib/import/csv';
import { mapRows, type ImportRowError } from '@/lib/import/menu-import';
import { requireAuth, type AuthContext } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';
import type { ImportResult } from '@/server/repositories/menu.repository';

/** Hard caps to keep imports synchronous and cheap. */
const MAX_CSV_BYTES = 512 * 1024;
const MAX_ROWS = 500;

type ImportActionResult =
  | { ok: true; result: ImportResult }
  | { ok: false; code: 'unauthorized' | 'rate_limited' | 'too_large' | 'plan_limit_reached' }
  | { ok: false; code: 'validation'; missingHeaders?: string[]; errors?: ImportRowError[] };

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

export async function importMenuAction(input: { csv: string }): Promise<ImportActionResult> {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  const limit = await checkRateLimit(ctx.tenantId, {
    identifier: 'menu-import',
    requests: 10,
    windowSec: 60,
  });
  if (!limit.allowed) return { ok: false, code: 'rate_limited' };

  const csv = typeof input?.csv === 'string' ? input.csv : '';
  if (Buffer.byteLength(csv, 'utf8') > MAX_CSV_BYTES) {
    return { ok: false, code: 'too_large' };
  }

  // Re-parse the raw CSV server-side: never trust client-sent rows (tenant security).
  const grid = parseCsv(csv);
  if (grid.length - 1 > MAX_ROWS) {
    return { ok: false, code: 'too_large' };
  }

  const mapped = mapRows(grid);
  if (!mapped.ok) {
    return { ok: false, code: 'validation', missingHeaders: mapped.missing };
  }
  if (mapped.errors.length > 0 || mapped.valid.length === 0) {
    return { ok: false, code: 'validation', errors: mapped.errors };
  }

  // Plan validation against current counts (free tier has hard limits).
  const limits = PLAN_CONFIG[ctx.plan].limits;
  if (limits.items !== null || limits.sections !== null) {
    const { items, sections } = await menuService.getMenuByTenantId(ctx.tenantId);

    if (limits.items !== null && items.length + mapped.valid.length > limits.items) {
      return { ok: false, code: 'plan_limit_reached' };
    }

    if (limits.sections !== null) {
      const existingSectionNames = new Set(sections.map((section) => section.name));
      const newSectionNames = new Set(
        mapped.valid
          .map((row) => row.sectionName)
          .filter((name): name is string => Boolean(name) && !existingSectionNames.has(name as string)),
      );
      if (existingSectionNames.size + newSectionNames.size > limits.sections) {
        return { ok: false, code: 'plan_limit_reached' };
      }
    }
  }

  const result = await menuService.importMenu(ctx.tenantId, mapped.valid);
  revalidateMenu(ctx);
  return { ok: true, result };
}
