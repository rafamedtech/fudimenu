import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { requireAuth } from '@/server/guards/require-auth';
import { AccountClient } from './account-client';

export default async function AccountPage() {
  const ctx = await requireAuth();
  const activeMembership = ctx.memberships.find((membership) => membership.tenantId === ctx.tenantId);
  const tenant = activeMembership?.tenant;

  if (!tenant) {
    throw new Error('tenant_not_found');
  }

  return (
    <>
      <AppHeader
        title="Cuenta"
        showBack
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <AccountClient
        email={ctx.email}
        tenantName={tenant.name}
        tenantSlug={tenant.slug}
        plan={tenant.plan}
      />
    </>
  );
}
