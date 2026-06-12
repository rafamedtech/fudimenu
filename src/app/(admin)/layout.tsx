import { Suspense } from 'react';
import { AdminProviders } from '@/components/admin-providers';
import { AuthBroadcast } from '@/components/admin/auth-broadcast';
import { MenuPreviewPanel } from '@/components/admin/menu-preview-panel';
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
  const activeMembership =
    ctx.memberships.find((membership) => membership.tenantId === ctx.tenantId) ??
    ctx.memberships[0];
  const tenant =
    process.env.USE_MOCKS === 'true'
      ? { primaryColor: mockTenant.primaryColor, slug: mockTenant.slug }
      : await getPrisma().tenant.findUnique({
          where: { id: ctx.tenantId },
          select: { primaryColor: true, slug: true },
        });

  return (
    <AdminProviders>
      <SidebarProvider>
        <a
          href="#admin-main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-md focus:bg-[var(--brand-card)] focus:px-4 focus:py-3 focus:font-bold focus:text-ink-900 focus:shadow-md"
        >
          Saltar al contenido
        </a>
        <div
          className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-[var(--brand-surface)] pb-[88px] ipad:max-w-[820px] ipad:pb-[104px] ipad-landscape:max-w-none ipad-landscape:flex-row ipad-landscape:pb-0 desktop:border-x desktop:border-[var(--brand-card-border)]"
          style={buildBrandThemeStyle(tenant?.primaryColor)}
        >
          <AuthBroadcast />
          <SidebarNav
            plan={ctx.plan}
            tenantName={activeMembership?.tenant.name ?? 'FudiMenu'}
            avatarUrl={ctx.avatarUrl}
          />
          <div id="admin-main" className="flex min-w-0 flex-1 flex-col ipad-landscape:items-center">
            <div className="w-full ipad-landscape:max-w-[984px] desktop:max-w-[1180px]">
              {children}
            </div>
          </div>
          {tenant?.slug && (
            <Suspense fallback={null}>
              <MenuPreviewPanel slug={tenant.slug} />
            </Suspense>
          )}
          <PwaInstallBanner />
          <BottomNav plan={ctx.plan} />
        </div>
      </SidebarProvider>
    </AdminProviders>
  );
}
