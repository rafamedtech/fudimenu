import { AdminProviders } from '@/components/admin-providers';
import { AuthBroadcast } from '@/components/admin/auth-broadcast';
import { BottomNav } from '@/components/layout/bottom-nav';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { SidebarProvider } from '@/components/layout/sidebar-context';
import { PwaInstallBanner } from '@/components/layout/pwa-install-banner';
import { buildBrandThemeStyle } from '@/lib/brand-theme';
import { getPrisma } from '@/lib/db/prisma';
import { mockTenant } from '@/lib/mock/data';
import { requireAuth } from '@/server/guards/require-auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAuth();
  const tenant =
    process.env.USE_MOCKS === 'true'
      ? { primaryColor: mockTenant.primaryColor }
      : await getPrisma().tenant.findUnique({
          where: { id: ctx.tenantId },
          select: { primaryColor: true },
        });

  return (
    <AdminProviders>
      <SidebarProvider>
        <div
          className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-[var(--brand-surface)] pb-[88px] ipad:max-w-[820px] ipad:pb-[104px] ipad-landscape:max-w-none ipad-landscape:flex-row ipad-landscape:pb-0 desktop:border-x desktop:border-[var(--brand-card-border)]"
          style={buildBrandThemeStyle(tenant?.primaryColor)}
        >
          <AuthBroadcast />
          <SidebarNav plan={ctx.plan} />
          <div className="flex min-w-0 flex-1 flex-col ipad-landscape:items-center">
            <div className="w-full ipad-landscape:max-w-[984px] desktop:max-w-[1180px]">
              {children}
            </div>
          </div>
          <PwaInstallBanner />
          <BottomNav plan={ctx.plan} />
        </div>
      </SidebarProvider>
    </AdminProviders>
  );
}
