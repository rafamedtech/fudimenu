'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getPrisma } from '@/lib/db/prisma';
import { createSupabaseServer } from '@/lib/supabase/server';
import { mockTenant } from '@/lib/mock/data';
import { tenantService } from '@/server/services/tenant.service';

const onboardingSchema = z.object({
  name: z.string().min(1).max(80),
  cuisine: z.string().min(1).max(40),
  itemName: z.string().min(1).max(80),
  priceCents: z.number().int().min(1).max(10_000_00),
});

export async function completeOnboardingAction(input: unknown) {
  const data = onboardingSchema.parse(input);

  if (process.env.USE_MOCKS === 'true') {
    return { ok: true as const, tenantId: mockTenant.id, slug: mockTenant.slug };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const prisma = getPrisma();
  const existingMembership = await prisma.membership.findFirst({
    where: { userId: user.id },
    select: {
      tenantId: true,
      tenant: { select: { slug: true } },
    },
  });

  if (existingMembership) {
    return {
      ok: true as const,
      tenantId: existingMembership.tenantId,
      slug: existingMembership.tenant.slug,
    };
  }

  const { tenantId, slug } = await tenantService.createFromOnboarding({
    userId: user.id,
    name: data.name,
    cuisine: data.cuisine,
    itemName: data.itemName,
    priceCents: data.priceCents,
  });

  return { ok: true as const, tenantId, slug };
}
