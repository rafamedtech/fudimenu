'use server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { PLAN_CONFIG } from '@/config/plans';
import { checkRateLimit } from '@/lib/ratelimit';
import { itemSchema } from '@/lib/validators/item.schema';
import { requireAuth, type AuthContext } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';
import { recordMenuEvent } from '@/server/services/audit.service';

type ItemActionError = {
  ok: false;
  code: 'unauthorized' | 'rate_limited' | 'plan_limit_reached';
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

  const limit = await checkRateLimit(ctx.tenantId, {
    identifier: 'item-upsert',
    requests: 200,
    windowSec: 60,
  });
  if (!limit.allowed) {
    return { ok: false as const, code: 'rate_limited' };
  }

  const data = itemSchema.parse(input);

  if (data.isSpecialToday && !PLAN_CONFIG[ctx.plan].features.specials) {
    return { ok: false as const, code: 'plan_limit_reached' as const };
  }

  if (!data.id) {
    const { tenant, items } = await menuService.getMenuByTenantId(ctx.tenantId);
    const freeItemLimit = PLAN_CONFIG.free.limits.items ?? 20;

    if (tenant.plan === 'free' && items.length >= freeItemLimit) {
      throw new Error('free_item_limit_reached');
    }
  }

  const item = await menuService.upsertItem(ctx.tenantId, data);
  await recordMenuEvent(ctx, {
    action: data.id ? 'item.updated' : 'item.created',
    entityType: 'menu_item',
    entityId: item.id,
    metadata: { name: item.name, priceCents: item.priceCents },
  });
  revalidateMenu(ctx);
  return { ok: true as const, item };
}

export async function toggleItemAvailabilityAction(itemId: string, available: boolean) {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  const item = await menuService.toggleItemAvailability(ctx.tenantId, itemId, available);
  await recordMenuEvent(ctx, {
    action: 'item.availability_changed',
    entityType: 'menu_item',
    entityId: item.id,
    metadata: { name: item.name, available },
  });
  revalidateMenu(ctx);
  return { ok: true as const, item };
}

export async function setItemSpecialTodayAction(itemId: string, isSpecialToday: boolean) {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  if (isSpecialToday && !PLAN_CONFIG[ctx.plan].features.specials) {
    return { ok: false as const, code: 'plan_limit_reached' as const };
  }

  const item = await menuService.setItemSpecialToday(ctx.tenantId, itemId, isSpecialToday);
  await recordMenuEvent(ctx, {
    action: 'item.special_changed',
    entityType: 'menu_item',
    entityId: item.id,
    metadata: { name: item.name, isSpecialToday },
  });
  revalidateMenu(ctx);
  return { ok: true as const, item };
}

export async function softDeleteItemAction(itemId: string) {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  const item = await menuService.softDeleteItem(ctx.tenantId, itemId);
  await recordMenuEvent(ctx, {
    action: 'item.deleted',
    entityType: 'menu_item',
    entityId: item.id,
    metadata: { name: item.name },
  });
  revalidateMenu(ctx);
  return { ok: true as const, item };
}

export async function restoreItemAction(itemId: string) {
  const ctx = await requireActionAuth();
  if ('ok' in ctx) return ctx;

  const item = await menuService.restoreItem(ctx.tenantId, itemId);
  await recordMenuEvent(ctx, {
    action: 'item.restored',
    entityType: 'menu_item',
    entityId: item.id,
    metadata: { name: item.name },
  });
  revalidateMenu(ctx);
  return { ok: true as const, item };
}

export async function removeItemSpecialTodayFormAction(formData: FormData) {
  const itemId = formData.get('itemId');
  if (typeof itemId !== 'string' || itemId.length === 0) return;

  await setItemSpecialTodayAction(itemId, false);
}
