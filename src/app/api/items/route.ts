import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';

export async function GET() {
  const ctx = await requireAuth();
  const items = await menuService.getCachedItemsByTenantId(ctx.tenantId);
  return NextResponse.json(items);
}
