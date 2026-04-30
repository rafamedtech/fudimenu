import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPrisma } from '@/lib/db/prisma';
import { createSupabaseServer } from '@/lib/supabase/server';
import { mockTenant } from '@/lib/mock/data';
import { ACTIVE_TENANT_COOKIE } from '@/server/tenants/active-tenant-cookie';

export type AuthContext = {
  userId: string;
  email: string;
  tenantId: string;
  role: 'owner' | 'admin' | 'staff';
};

export async function requireAuth(): Promise<AuthContext> {
  if (process.env.E2E_TEST_AUTH === 'true') {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('e2e_tenant_id')?.value;

    if (tenantId) {
      return {
        userId: cookieStore.get('e2e_user_id')?.value ?? 'e2e-user',
        email: 'e2e@fudimenu.test',
        tenantId,
        role: 'owner',
      };
    }
  }

  if (process.env.USE_MOCKS === 'true') {
    return {
      userId: 'usr_demo',
      email: 'demo@fudimenu.app',
      tenantId: mockTenant.id,
      role: 'owner',
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
  const memberships = await prisma.membership.findMany({
    where: { userId: user.id, deletedAt: null },
    select: { tenantId: true, role: true },
    orderBy: { createdAt: 'asc' },
  });
  const membership =
    memberships.find(({ tenantId }) => tenantId === activeTenantId) ?? memberships[0];

  if (!membership) redirect('/onboarding');

  return {
    userId: user.id,
    email: user.email!,
    tenantId: membership.tenantId,
    role: membership.role as AuthContext['role'],
  };
}
