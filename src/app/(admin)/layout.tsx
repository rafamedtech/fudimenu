import { BottomNav } from '@/components/layout/bottom-nav';
import { requireAuth } from '@/server/guards/require-auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-crema-50 pb-[88px]">
      {children}
      <BottomNav />
    </div>
  );
}
