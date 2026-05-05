'use server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { PLAN_CONFIG } from '@/config/plans';
import { itemSchema } from '@/lib/validators/item.schema';
import { requireAuth, type AuthContext } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';

type ItemActionError = {
  ok: false;
  code: 'unauthorized';
};

function revalidateMenu(ctx: AuthContext) {
  revalidateTag(`menu:${ctx.tenantId}`);
  revalidateTag(`tenant:${ctx.tenantId}`);

  revalidatePath('/menu');
  revalidatePath('/dashboard');

  const activeMembership = ctx.memberships.find(
    (membership) => membership.tenantId === ctx.tenantId,
  );

  if (activeMembership) revalidatePath(`/m/${activeMembership.tenant.slug}`);
}

async function requireActionAuth(): Promise<AuthContext | ItemActionError> {
  try {
    return await requireAuth();
  } catch (error) {
    if (isRedirectError(error)) return { ok: false, code: 'unauthorized' };
    throw error;
  }
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

export async function upsertItemAction(input: unknown) {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  const data = itemSchema.parse(input);

  if (!data.id) {
    const { tenant, items } = await menuService.getMenuByTenantId(ctx.tenantId);
    const freeItemLimit = PLAN_CONFIG.free.limits.items ?? 20;

    if (tenant.plan === 'free' && items.length >= freeItemLimit) {
      throw new Error('free_item_limit_reached');
    }
  }

  const item = await menuService.upsertItem(ctx.tenantId, data);
  revalidateMenu(ctx);
  return { ok: true as const, item };
}

export async function toggleItemAvailabilityAction(itemId: string, available: boolean) {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  const item = await menuService.toggleItemAvailability(ctx.tenantId, itemId, available);
  revalidateMenu(ctx);
  return { ok: true as const, item };
}

export async function setItemSpecialTodayAction(itemId: string, isSpecialToday: boolean) {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  const item = await menuService.setItemSpecialToday(ctx.tenantId, itemId, isSpecialToday);
  revalidateMenu(ctx);
  return { ok: true as const, item };
}

export async function softDeleteItemAction(itemId: string) {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  const item = await menuService.softDeleteItem(ctx.tenantId, itemId);
  revalidateMenu(ctx);
  return { ok: true as const, item };
}

export async function restoreItemAction(itemId: string) {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  const item = await menuService.restoreItem(ctx.tenantId, itemId);
  revalidateMenu(ctx);
  return { ok: true as const, item };
}
