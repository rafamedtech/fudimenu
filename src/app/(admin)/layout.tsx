import { AdminProviders } from '@/components/admin-providers';
import { AuthBroadcast } from '@/components/admin/auth-broadcast';
import { BottomNav } from '@/components/layout/bottom-nav';
import { PwaInstallBanner } from '@/components/layout/pwa-install-banner';
import { buildBrandThemeStyle } from '@/lib/brand-theme';
import { getPrisma } from '@/lib/db/prisma';
import { mockTenant } from '@/lib/mock/data';
import { requireAuth } from '@/server/guards/require-auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAuth();
  const tenant =
    process.env.USE_MOCKS === 'true'
      ? mockTenant
      : await getPrisma().tenant.findUnique({
          where: { id: ctx.tenantId },
          select: { primaryColor: true },
        });

  return (
    <AdminProviders>
      <div
        className="mx-auto flex min-h-dvh max-w-md flex-col bg-[var(--brand-surface)] pb-[88px]"
        style={buildBrandThemeStyle(tenant?.primaryColor)}
      >
        <AuthBroadcast />
        {children}
        <PwaInstallBanner />
        <BottomNav plan={ctx.plan} />
      </div>
    </AdminProviders>
  );
}
