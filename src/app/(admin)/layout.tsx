import { AuthBroadcast } from '@/components/admin/auth-broadcast';
import { BottomNav } from '@/components/layout/bottom-nav';
import { PwaInstallBanner } from '@/components/layout/pwa-install-banner';
import { requireAuth } from '@/server/guards/require-auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAuth();
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-crema-50 pb-[88px]">
      <AuthBroadcast />
      {children}
      <PwaInstallBanner />
      <BottomNav plan={ctx.plan} />
    </div>
  );
}
