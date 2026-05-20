import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import { getPrisma } from '@/lib/db/prisma';
import { createSupabaseServer } from '@/lib/supabase/server';
import { mockTenant } from '@/lib/mock/data';
import { getUserMemberships } from '@/server/guards/get-user-memberships';
import { ACTIVE_TENANT_COOKIE } from '@/server/tenants/active-tenant-cookie';
import type { Plan } from '@/types/domain';

export type AuthRole = 'owner' | 'admin' | 'staff';

export type AuthContext = {
  userId: string;
  email: string;
  avatarUrl: string | null;
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

function normalizeAvatarUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function getAvatarUrl(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;

  const record = metadata as Record<string, unknown>;
  return normalizeAvatarUrl(record.avatar_url) ?? normalizeAvatarUrl(record.picture);
}

function getUserAvatarUrl(user: { user_metadata?: unknown; identities?: Array<{ identity_data?: unknown }> | null }) {
  const metadataAvatar = getAvatarUrl(user.user_metadata);
  if (metadataAvatar) return metadataAvatar;

  return (
    user.identities
      ?.map((identity) => getAvatarUrl(identity.identity_data))
      .find((avatarUrl): avatarUrl is string => Boolean(avatarUrl)) ?? null
  );
}

export async function requireAuth(): Promise<AuthContext> {
  if (process.env.E2E_TEST_AUTH === 'true') {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('e2e_tenant_id')?.value;

    if (tenantId) {
      const e2eUserId = cookieStore.get('e2e_user_id')?.value ?? 'e2e-user';
      const prisma = getPrisma();
      const e2eMemberships = await getUserMemberships(e2eUserId);

      if (e2eMemberships.length > 0) {
        let membership = e2eMemberships.find((item) => item.tenantId === tenantId);
        if (!membership) {
          await prisma.auditLog.create({
            data: {
              tenantId: e2eMemberships[0]?.tenantId ?? tenantId,
              actorUserId: e2eUserId,
              action: 'auth.invalid_tenant_cookie',
              entityType: 'membership',
              entityId: tenantId,
              metadata: {
                attemptedTenantId: tenantId,
                availableTenantIds: e2eMemberships.map((item) => item.tenantId),
              },
            },
          });
          membership = e2eMemberships[0];
        }

        return {
          userId: e2eUserId,
          email: 'e2e@fudimenu.test',
          avatarUrl: null,
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
        avatarUrl: null,
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
      avatarUrl: null,
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

  const memberships = await getUserMemberships(user.id);

  if (activeTenantId && !memberships.some((membership) => membership.tenantId === activeTenantId)) {
    const auditTenantId = memberships[0]?.tenantId;
    if (auditTenantId) {
      await getPrisma().auditLog.create({
        data: {
          tenantId: auditTenantId,
          actorUserId: user.id,
          action: 'auth.invalid_tenant_cookie',
          entityType: 'membership',
          entityId: activeTenantId,
          metadata: {
            attemptedTenantId: activeTenantId,
            availableTenantIds: memberships.map((membership) => membership.tenantId),
          },
        },
      });
    }

    try {
      (cookieStore as { delete?: (name: string) => void }).delete?.(ACTIVE_TENANT_COOKIE);
    } catch {
      // Request cookies are read-only in Server Components. Audit log still records the bad cookie.
    }
  }

  const membership =
    memberships.find(({ tenantId }) => tenantId === activeTenantId) ?? memberships[0];

  if (!membership) redirect('/onboarding');

  const ctx = {
    userId: user.id,
    email: user.email!,
    avatarUrl: getUserAvatarUrl(user),
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

  Sentry.setTag('tenant_id', ctx.tenantId);
  Sentry.setTag('plan', ctx.plan);
  Sentry.setTag('role', ctx.role);

  return ctx;
}
