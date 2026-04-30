import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { requireAuth } from '@/server/guards/require-auth';

const links = [
  { href: '/settings/brand', label: 'Marca y tema', emoji: '🎨' },
  { href: '/settings/billing', label: 'Plan y facturación', emoji: '💳' },
  { href: '/qr', label: 'QR y compartir', emoji: '📱' },
  { href: '/account', label: 'Cuenta', emoji: '👤' },
];

export default async function SettingsPage() {
  const ctx = await requireAuth();

  return (
    <>
      <AppHeader
        title="Ajustes"
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="flex flex-col gap-3 px-4">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="flex items-center gap-3">
              <span className="text-2xl">{l.emoji}</span>
              <span className="flex-1 font-semibold">{l.label}</span>
              <ChevronRight size={20} className="text-ink-300" />
            </Card>
          </Link>
        ))}
      </main>
    </>
  );
}
