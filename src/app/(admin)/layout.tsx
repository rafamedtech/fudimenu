import { AdminProviders } from '@/components/admin-providers';
import { AuthBroadcast } from '@/components/admin/auth-broadcast';
import { BottomNav } from '@/components/layout/bottom-nav';
import { PwaInstallBanner } from '@/components/layout/pwa-install-banner';
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
  const brandColor = tenant?.primaryColor ?? '#F4B400';
  return (
    <AdminProviders>
      <div
        className="mx-auto flex min-h-dvh max-w-md flex-col bg-crema-50 pb-[88px]"
        style={
          {
            '--brand': brandColor,
            '--mostaza-500': brandColor,
            '--mostaza-50': `color-mix(in srgb, ${brandColor} 12%, white)`,
            '--mostaza-100': `color-mix(in srgb, ${brandColor} 24%, white)`,
            '--mostaza-400': `color-mix(in srgb, ${brandColor} 70%, white)`,
            '--mostaza-600': `color-mix(in srgb, ${brandColor} 85%, black)`,
          } as React.CSSProperties
        }
      >
        <AuthBroadcast />
        {children}
        <PwaInstallBanner />
        <BottomNav plan={ctx.plan} />
      </div>
    </AdminProviders>
  );
}
