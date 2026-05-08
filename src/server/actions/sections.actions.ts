'use server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { requireAuth, type AuthContext } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';
import {
  sectionSchema,
  reorderSectionsSchema,
} from '@/lib/validators/section.schema';
import { checkRateLimit } from '@/lib/ratelimit';
import { PLAN_CONFIG } from '@/config/plans';

type SectionActionError = 'unauthorized' | 'validation' | 'not_found' | 'rate_limited';

function fail(code: SectionActionError, error?: string) {
  return { ok: false as const, code, error };
}

function isRedirectError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof error.digest === 'string' &&
    error.digest.startsWith('NEXT_REDIRECT;')
  );
}

async function requireActionAuth() {
  try {
    return await requireAuth();
  } catch (error) {
    if (isRedirectError(error)) return fail('unauthorized');
    throw error;
  }
}

function revalidateMenu(ctx: AuthContext) {
  revalidateTag(`menu:${ctx.tenantId}`);
  revalidateTag(`tenant:${ctx.tenantId}`);
  revalidatePath('/menu');
  revalidatePath('/dashboard');
  const active = ctx.memberships.find((m) => m.tenantId === ctx.tenantId);
  if (active) revalidatePath(`/m/${active.tenant.slug}`);
}

export async function upsertSectionAction(input: unknown) {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  const limit = await checkRateLimit(ctx.tenantId, {
    identifier: 'section-upsert',
    requests: 60,
    windowSec: 60,
  });
  if (!limit.allowed) return fail('rate_limited');

  const parsed = sectionSchema.safeParse(input);
  if (!parsed.success) return fail('validation', parsed.error.message);

  try {
    if (!parsed.data.id && typeof menuService.getMenuByTenantId === 'function') {
      const { tenant, sections } = await menuService.getMenuByTenantId(ctx.tenantId);
      const freeSectionLimit = PLAN_CONFIG.free.limits.sections ?? 5;
      if (tenant.plan === 'free' && sections.length >= freeSectionLimit) {
        return fail('validation', 'free_section_limit_reached');
      }
    }

    const section = await menuService.upsertSection(ctx.tenantId, parsed.data);
    revalidateMenu(ctx);
    return { ok: true as const, section };
  } catch (err) {
    if (err instanceof Error && err.message === 'not_found') return fail('not_found');
    throw err;
  }
}

export async function softDeleteSectionAction(sectionId: string) {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  try {
    await menuService.deleteSection(ctx.tenantId, sectionId);
    revalidateMenu(ctx);
    return { ok: true as const };
  } catch (err) {
    if (err instanceof Error && err.message === 'not_found') return fail('not_found');
    throw err;
  }
}

export async function reorderSectionsAction(input: unknown) {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  const parsed = reorderSectionsSchema.safeParse(input);
  if (!parsed.success) return fail('validation', parsed.error.message);

  await menuService.reorderSections(ctx.tenantId, parsed.data.sectionIds);
  revalidateMenu(ctx);
  return { ok: true as const };
}
