'use server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { canCreateAnotherMenu } from '@/config/plans';
import { getPrisma } from '@/lib/db/prisma';
import { mockCategories, mockItems, mockTenant } from '@/lib/mock/data';
import { checkRateLimit } from '@/lib/ratelimit';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getMenuRepository } from '@/server/repositories/get-repository';
import { tenantService } from '@/server/services/tenant.service';
import {
  ACTIVE_TENANT_COOKIE,
  activeTenantCookieOptions,
} from '@/server/tenants/active-tenant-cookie';

const onboardingSchema = z.object({
  name: z.string().min(1).max(80),
  cuisine: z.string().min(1).max(40),
  itemName: z.string().min(1).max(80).optional(),
  priceCents: z.number().int().min(1).max(10_000_00).optional(),
});

async function applyMockOnboarding(data: z.infer<typeof onboardingSchema>) {
  if (process.env.USE_MOCKS === 'true') {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_TENANT_COOKIE, mockTenant.id, activeTenantCookieOptions);
    if (data.itemName && data.priceCents) {
      cookieStore.set('mock_onboarding_item', JSON.stringify({
        name: data.itemName,
        priceCents: data.priceCents,
      }));
    } else {
      cookieStore.delete('mock_onboarding_item');
    }

    const firstMockItem = mockItems[0];
    await (
      await getMenuRepository()
    ).upsertItem(mockTenant.id, {
      id: 'itm_1',
      tenantId: mockTenant.id,
      categoryId: mockCategories[0]?.id ?? null,
      name: data.itemName && data.priceCents ? data.itemName : firstMockItem?.name,
      priceCents: data.itemName && data.priceCents ? data.priceCents : firstMockItem?.priceCents,
      sortOrder: 0,
    });
    revalidatePath('/menu');

    return { ok: true as const, existing: false as const, tenantId: mockTenant.id, slug: mockTenant.slug };
  }

  return null;
}

async function getOnboardingUser() {
  let user: { id: string; email?: string | null } | null = null;

  if (process.env.E2E_TEST_AUTH === 'true') {
    const cookieStore = await cookies();
    const e2eUserId = cookieStore.get('e2e_user_id')?.value;
    if (e2eUserId) {
      user = {
        id: e2eUserId,
        email: cookieStore.get('e2e_user_email')?.value ?? 'e2e@fudimenu.test',
      };
    }
  }

  if (!user) {
    const supabase = await createSupabaseServer();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    user = supabaseUser;
  }

  if (!user) redirect('/login');

  return user;
}

async function setActiveTenant(tenantId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TENANT_COOKIE, tenantId, activeTenantCookieOptions);
  if (process.env.E2E_TEST_AUTH === 'true') {
    cookieStore.set('e2e_tenant_id', tenantId, activeTenantCookieOptions);
  }
  revalidatePath('/', 'layout');
}

export async function completeOnboardingAction(input: unknown) {
  const data = onboardingSchema.parse(input);
  const mockResult = await applyMockOnboarding(data);
  if (mockResult) return mockResult;

  const user = await getOnboardingUser();
  const limit = await checkRateLimit(user.id, {
    identifier: 'onboarding-complete',
    requests: 5,
    windowSec: 3600,
  });
  if (!limit.allowed) {
    throw new Error('rate_limited');
  }

  const prisma = getPrisma();
  const existingMembership = await prisma.membership.findFirst({
    where: { userId: user.id },
    select: {
      tenantId: true,
      tenant: { select: { slug: true } },
    },
  });

  if (existingMembership) {
    await setActiveTenant(existingMembership.tenantId);

    return {
      ok: true as const,
      existing: true as const,
      tenantId: existingMembership.tenantId,
      slug: existingMembership.tenant.slug,
    };
  }

  const { tenantId, slug } = await tenantService.createFromOnboarding({
    userId: user.id,
    email: user.email!,
    name: data.name,
    cuisine: data.cuisine,
    itemName: data.itemName,
    priceCents: data.priceCents,
  });

  await setActiveTenant(tenantId);

  return { ok: true as const, existing: false as const, tenantId, slug };
}

export async function createSecondTenantAction(input: unknown) {
  const data = onboardingSchema.parse(input);
  const mockResult = await applyMockOnboarding(data);
  if (mockResult) return mockResult;

  const user = await getOnboardingUser();

  const prisma = getPrisma();
  // eslint-disable-next-line fudimenu/require-tenant-id-in-prisma-findmany -- Plan-limit check needs cross-tenant view of the user's own memberships before any tenant is active.
  const memberships = await prisma.membership.findMany({
    where: { userId: user.id, deletedAt: null },
    select: { role: true, tenant: { select: { plan: true } } },
  });

  if (!canCreateAnotherMenu(memberships)) {
    throw new Error('plan_limit_reached');
  }

  const { tenantId, slug } = await tenantService.createFromOnboarding({
    userId: user.id,
    email: user.email!,
    name: data.name,
    cuisine: data.cuisine,
    itemName: data.itemName,
    priceCents: data.priceCents,
  });

  await setActiveTenant(tenantId);

  return { ok: true as const, existing: false as const, tenantId, slug };
}
