'use server';
import { revalidateTag } from 'next/cache';
import { itemSchema } from '@/lib/validators/item.schema';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';

export async function upsertItemAction(input: unknown) {
  const ctx = await requireAuth();
  const data = itemSchema.parse(input);
  const item = await menuService.upsertItem(ctx.tenantId, data);
  revalidateTag(`menu:${ctx.tenantId}`);
  return { ok: true as const, item };
}

export async function toggleItemAvailabilityAction(itemId: string, available: boolean) {
  const ctx = await requireAuth();
  const item = await menuService.toggleItemAvailability(ctx.tenantId, itemId, available);
  revalidateTag(`menu:${ctx.tenantId}`);
  return { ok: true as const, item };
}
