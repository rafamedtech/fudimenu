'use server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { itemSchema } from '@/lib/validators/item.schema';
import { requireAuth, type AuthContext } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';

function revalidateMenu(ctx: AuthContext) {
  const activeMembership = ctx.memberships.find(
    (membership) => membership.tenantId === ctx.tenantId,
  );

  revalidateTag(`menu:${ctx.tenantId}`);
  revalidatePath('/menu');
  revalidatePath('/dashboard');
  if (activeMembership) revalidatePath(`/m/${activeMembership.tenant.slug}`);
}

export async function upsertItemAction(input: unknown) {
  const ctx = await requireAuth();
  const data = itemSchema.parse(input);
  const item = await menuService.upsertItem(ctx.tenantId, data);
  revalidateMenu(ctx);
  return { ok: true as const, item };
}

export async function toggleItemAvailabilityAction(itemId: string, available: boolean) {
  const ctx = await requireAuth();
  const item = await menuService.toggleItemAvailability(ctx.tenantId, itemId, available);
  revalidateMenu(ctx);
  return { ok: true as const, item };
}

export async function setItemSpecialTodayAction(itemId: string, isSpecialToday: boolean) {
  const ctx = await requireAuth();
  const item = await menuService.setItemSpecialToday(ctx.tenantId, itemId, isSpecialToday);
  revalidateMenu(ctx);
  return { ok: true as const, item };
}

export async function softDeleteItemAction(itemId: string) {
  const ctx = await requireAuth();
  const item = await menuService.softDeleteItem(ctx.tenantId, itemId);
  revalidateMenu(ctx);
  return { ok: true as const, item };
}

export async function restoreItemAction(itemId: string) {
  const ctx = await requireAuth();
  const item = await menuService.restoreItem(ctx.tenantId, itemId);
  revalidateMenu(ctx);
  return { ok: true as const, item };
}
