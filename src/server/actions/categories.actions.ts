'use server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { requireAuth, type AuthContext } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';
import { categorySchema, reorderCategoriesSchema } from '@/lib/validators/item.schema';
import { checkRateLimit } from '@/lib/ratelimit';

type CategoryActionError = 'unauthorized' | 'validation' | 'not_found' | 'rate_limited';

function fail(code: CategoryActionError, error?: string) {
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
  const active = ctx.memberships.find((m) => m.tenantId === ctx.tenantId);
  if (active) revalidatePath(`/m/${active.tenant.slug}`);
}

export async function upsertCategoryAction(input: unknown) {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  const limit = await checkRateLimit(ctx.tenantId, {
    identifier: 'category-upsert',
    requests: 60,
    windowSec: 60,
  });
  if (!limit.allowed) return fail('rate_limited');

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail('validation', parsed.error.message);

  try {
    const category = await menuService.upsertCategory(ctx.tenantId, parsed.data);
    revalidateMenu(ctx);
    return { ok: true as const, category };
  } catch (err) {
    if (err instanceof Error && err.message === 'not_found') return fail('not_found');
    throw err;
  }
}

export async function softDeleteCategoryAction(categoryId: string) {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  try {
    await menuService.deleteCategory(ctx.tenantId, categoryId);
    revalidateMenu(ctx);
    return { ok: true as const };
  } catch (err) {
    if (err instanceof Error && err.message === 'not_found') return fail('not_found');
    throw err;
  }
}

export async function reorderCategoriesAction(input: unknown) {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  const parsed = reorderCategoriesSchema.safeParse(input);
  if (!parsed.success) return fail('validation', parsed.error.message);

  await menuService.reorderCategories(
    ctx.tenantId,
    parsed.data.sectionId,
    parsed.data.categoryIds,
  );
  revalidateMenu(ctx);
  return { ok: true as const };
}
