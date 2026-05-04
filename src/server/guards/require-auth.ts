import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPrisma } from '@/lib/db/prisma';
import { createSupabaseServer } from '@/lib/supabase/server';
import { mockTenant } from '@/lib/mock/data';
import { ACTIVE_TENANT_COOKIE } from '@/server/tenants/active-tenant-cookie';
import type { Plan } from '@/types/domain';

export type AuthRole = 'owner' | 'admin' | 'staff';

export type AuthContext = {
  userId: string;
  email: string;
  tenantId: string;
  plan: Plan;
  role: AuthRole;
  memberships: Array<{
    tenantId: string;
    role: AuthRole;
    tenant: {
      name: string;
      slug: string;
      plan: Plan;
    };
  }>;
};

export async function requireAuth(): Promise<AuthContext> {
  if (process.env.E2E_TEST_AUTH === 'true') {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('e2e_tenant_id')?.value;

    if (tenantId) {
      const e2eUserId = cookieStore.get('e2e_user_id')?.value ?? 'e2e-user';
      const prisma = getPrisma();
      // eslint-disable-next-line fudimenu/require-tenant-id-in-prisma-findmany -- E2E auth must load the test user's memberships before enforcing the requested tenant.
      const e2eMemberships = await prisma.membership.findMany({
        where: { userId: e2eUserId, deletedAt: null },
        select: {
          tenantId: true,
          role: true,
          tenant: {
            select: { name: true, slug: true, plan: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (e2eMemberships.length > 0) {
        const membership = e2eMemberships.find((item) => item.tenantId === tenantId);
        if (!membership) redirect('/login');

        return {
          userId: e2eUserId,
          email: 'e2e@fudimenu.test',
          tenantId: membership.tenantId,
          plan: membership.tenant.plan as Plan,
          role: membership.role as AuthRole,
          memberships: e2eMemberships.map((item) => ({
            tenantId: item.tenantId,
            role: item.role as AuthRole,
            tenant: {
              ...item.tenant,
              plan: item.tenant.plan as Plan,
            },
          })),
        };
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, slug: true, plan: true },
      });
      const tenantInfo = tenant
        ? { name: tenant.name, slug: tenant.slug, plan: tenant.plan as Plan }
        : { name: 'E2E tenant', slug: 'e2e-tenant', plan: 'pro' as Plan };

      return {
        userId: e2eUserId,
        email: 'e2e@fudimenu.test',
        tenantId,
        plan: tenantInfo.plan,
        role: 'owner',
        memberships: [
          {
            tenantId,
            role: 'owner',
            tenant: tenantInfo,
          },
        ],
      };
    }
  }

  if (process.env.USE_MOCKS === 'true') {
    return {
      userId: 'usr_demo',
      email: 'demo@fudimenu.app',
      tenantId: mockTenant.id,
      plan: mockTenant.plan,
      role: 'owner',
      memberships: [
        {
          tenantId: mockTenant.id,
          role: 'owner',
          tenant: { name: mockTenant.name, slug: mockTenant.slug, plan: mockTenant.plan },
        },
      ],
    };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const activeTenantId = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value;
  const prisma = getPrisma();
  // eslint-disable-next-line fudimenu/require-tenant-id-in-prisma-findmany -- Auth bootstrap must discover the user's allowed tenants before a trusted tenantId exists.
  const memberships = await prisma.membership.findMany({
    where: { userId: user.id, deletedAt: null },
    select: {
      tenantId: true,
      role: true,
      tenant: {
        select: { name: true, slug: true, plan: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  const membership =
    memberships.find(({ tenantId }) => tenantId === activeTenantId) ?? memberships[0];

  if (!membership) redirect('/onboarding');

  return {
    userId: user.id,
    email: user.email!,
    tenantId: membership.tenantId,
    plan: membership.tenant.plan as Plan,
    role: membership.role as AuthRole,
    memberships: memberships.map((item) => ({
      tenantId: item.tenantId,
      role: item.role as AuthRole,
      tenant: {
        ...item.tenant,
        plan: item.tenant.plan as Plan,
      },
    })),
  };
}
