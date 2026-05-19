import { AppHeader } from '@/components/layout/app-header';
import { DeleteMenuCard } from '@/components/admin/delete-menu-card';
import { ProBadge, ProFeatureLock } from '@/components/admin/pro-feature-lock';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Building2, ChevronRight, Sparkles } from 'lucide-react';
import { canCreateAnotherMenu } from '@/config/plans';
import { requireAuth } from '@/server/guards/require-auth';

const links = [
  { href: '/settings/brand', label: 'Marca y tema', emoji: '🎨' },
  { href: '/settings/contact', label: 'WhatsApp y horarios', emoji: '💬' },
  { href: '/settings/billing', label: 'Plan y facturación', emoji: '💳' },
  { href: '/settings/referrals', label: 'Referidos', emoji: '🎁' },
  { href: '/qr', label: 'QR y compartir', emoji: '📱' },
  { href: '/account', label: 'Cuenta', emoji: '👤' },
];

export default async function SettingsPage() {
  const ctx = await requireAuth();
  const activeMembership = ctx.memberships.find((m) => m.tenantId === ctx.tenantId);
  const canDeleteMenu =
    canCreateAnotherMenu(ctx.memberships) &&
    ctx.memberships.length > 1 &&
    activeMembership?.role === 'owner';

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

        {ctx.plan === 'free' ? (
          <>
            <ProFeatureLock
              title="Quitar marca es Pro"
              description="Oculta el footer 'Hecho con FudiMenu' para que el menú público se sienta 100% tuyo."
              className="block"
            >
              <Card className="flex items-center gap-3 border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm">
                <Sparkles className="h-6 w-6 text-mostaza-600" />
                <span className="flex-1 font-semibold">Quitar marca FudiMenu</span>
                <ProBadge />
              </Card>
            </ProFeatureLock>
            <ProFeatureLock
              title="Multi-sucursal es Pro"
              description="Administra varias sucursales sin duplicar trabajo y cambia entre restaurantes desde el panel."
              className="block"
            >
              <Card className="flex items-center gap-3 border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm">
                <Building2 className="h-6 w-6 text-mostaza-600" />
                <span className="flex-1 font-semibold">Sucursales</span>
                <ProBadge />
              </Card>
            </ProFeatureLock>
          </>
        ) : (
          <Card className="flex items-center gap-3 opacity-80">
            <Building2 className="h-6 w-6 text-ink-500" />
            <span className="flex-1 font-semibold">Sucursales</span>
            <span className="text-xs font-semibold text-ink-500">Próximamente</span>
          </Card>
        )}

        {canDeleteMenu && activeMembership && (
          <DeleteMenuCard tenantId={ctx.tenantId} tenantName={activeMembership.tenant.name} />
        )}
      </main>
    </>
  );
}
