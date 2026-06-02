import { AppHeader } from '@/components/layout/app-header';
import { DeleteMenuCard } from '@/components/admin/delete-menu-card';
import { ProBadge, ProFeatureLock } from '@/components/admin/pro-feature-lock';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import {
  Building2,
  ChevronRight,
  CreditCard,
  Gift,
  MessageCircle,
  Palette,
  QrCode,
  Sparkles,
  Trash2,
  UserCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { canCreateAnotherMenu } from '@/config/plans';
import { requireAuth } from '@/server/guards/require-auth';
import { SettingsTabs, type SettingsTab } from './settings-tabs';

type SettingLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

type SettingsSection = {
  id: string;
  eyebrow: string;
  title: string;
  icon: LucideIcon;
  links: SettingLink[];
};

const SECTIONS: SettingsSection[] = [
  {
    id: 'brand',
    eyebrow: 'Tu identidad',
    title: 'Marca y menú',
    icon: Palette,
    links: [
      {
        href: '/settings/brand',
        label: 'Marca y tema',
        description: 'Logo, colores y tipografía del menú público.',
        icon: Palette,
      },
      {
        href: '/qr',
        label: 'QR y compartir',
        description: 'Descarga, imprime y comparte tu código.',
        icon: QrCode,
      },
    ],
  },
  {
    id: 'ops',
    eyebrow: 'Día a día',
    title: 'Operaciones',
    icon: MessageCircle,
    links: [
      {
        href: '/settings/contact',
        label: 'WhatsApp y horarios',
        description: 'Número de pedidos y cuándo está abierto.',
        icon: MessageCircle,
      },
      {
        href: '/settings/referrals',
        label: 'Referidos',
        description: 'Invita restaurantes y gana meses gratis.',
        icon: Gift,
      },
    ],
  },
  {
    id: 'account',
    eyebrow: 'Tu cuenta',
    title: 'Plan y acceso',
    icon: CreditCard,
    links: [
      {
        href: '/settings/billing',
        label: 'Plan y facturación',
        description: 'Suscripción, métodos de pago y recibos.',
        icon: CreditCard,
      },
      {
        href: '/account',
        label: 'Cuenta',
        description: 'Correo, contraseña y sesión.',
        icon: UserCircle2,
      },
    ],
  },
];

export default async function SettingsPage() {
  const ctx = await requireAuth();
  const activeMembership = ctx.memberships.find((m) => m.tenantId === ctx.tenantId);
  const canDeleteMenu =
    canCreateAnotherMenu(ctx.memberships) &&
    ctx.memberships.length > 1 &&
    activeMembership?.role === 'owner';

  const tabs: SettingsTab[] = SECTIONS.map((section) => ({
    id: section.id,
    label: section.title,
    icon: <section.icon className="size-4" strokeWidth={2.25} />,
    panel: (
      <section aria-labelledby={`section-${section.id}`}>
        <SectionHeader
          id={`section-${section.id}`}
          eyebrow={section.eyebrow}
          title={section.title}
          meta={`${section.links.length} opciones`}
        />
        <div className="mt-4 grid gap-3 ipad:grid-cols-2 ipad:gap-4 ipad-landscape:mt-0">
          {section.links.map((link) => (
            <SettingsRow key={link.href} {...link} />
          ))}
        </div>
      </section>
    ),
  }));

  tabs.push({
    id: 'pro',
    label: 'Más herramientas',
    icon: <Sparkles className="size-4" strokeWidth={2.25} />,
    panel: (
      <section aria-labelledby="section-pro">
        <SectionHeader
          id="section-pro"
          eyebrow="Crece con Pro"
          eyebrowClassName="text-mostaza-700"
          title="Más herramientas"
        />
        <div className="mt-4 grid gap-3 ipad:grid-cols-2 ipad:gap-4 ipad-landscape:mt-0">
          {ctx.plan === 'free' ? (
            <>
              <ProFeatureLock
                title="Quitar marca es Pro"
                description="Oculta el footer 'Hecho con FudiMenu' para que el menú público se sienta 100% tuyo."
                className="block"
              >
                <ProRow
                  icon={Sparkles}
                  label="Quitar marca FudiMenu"
                  description="Esconde el footer en tu menú público."
                />
              </ProFeatureLock>
              <ProFeatureLock
                title="Multi-sucursal es Pro"
                description="Administra varias sucursales sin duplicar trabajo y cambia entre restaurantes desde el panel."
                className="block"
              >
                <ProRow
                  icon={Building2}
                  label="Sucursales"
                  description="Maneja varias ubicaciones sin duplicar trabajo."
                />
              </ProFeatureLock>
            </>
          ) : (
            <Card className="flex items-center gap-4 opacity-90 ipad:min-h-24 ipad:p-5">
              <span className="inline-flex size-11 items-center justify-center rounded-lg bg-[var(--brand-surface-strong)] text-ink-500">
                <Building2 className="size-5" />
              </span>
              <div className="flex-1">
                <p className="font-semibold text-ink-900">Sucursales</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  Maneja varias ubicaciones sin duplicar trabajo.
                </p>
              </div>
              <span className="rounded-full bg-[var(--brand-surface-strong)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-ink-500">
                Pronto
              </span>
            </Card>
          )}
        </div>
      </section>
    ),
  });

  if (canDeleteMenu && activeMembership) {
    tabs.push({
      id: 'danger',
      label: 'Eliminar menú',
      icon: <Trash2 className="size-4" strokeWidth={2.25} />,
      panel: (
        <section aria-labelledby="section-danger">
          <SectionHeader
            id="section-danger"
            eyebrow="Zona delicada"
            eyebrowClassName="text-coral-600"
            title="Eliminar menú"
          />
          <div className="mt-4 ipad-landscape:mt-0">
            <DeleteMenuCard tenantId={ctx.tenantId} tenantName={activeMembership.tenant.name} />
          </div>
        </section>
      ),
    });
  }

  return (
    <>
      <AppHeader
        title="Ajustes"
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 ipad:px-6 ipad-landscape:px-7 desktop:px-8">
        <SettingsTabs tabs={tabs} />
      </main>
    </>
  );
}

function SectionHeader({
  id,
  eyebrow,
  title,
  meta,
  eyebrowClassName = 'text-ink-500',
}: {
  id: string;
  eyebrow: string;
  title: string;
  meta?: string;
  eyebrowClassName?: string;
}) {
  return (
    <header className="flex items-baseline justify-between gap-3 ipad-landscape:hidden">
      <div>
        <p
          className={`text-[11px] font-black uppercase tracking-wider ${eyebrowClassName}`}
        >
          {eyebrow}
        </p>
        <h2
          id={id}
          className="mt-1 font-heading text-xl font-extrabold text-ink-900 ipad:text-2xl"
        >
          {title}
        </h2>
      </div>
      {meta ? (
        <span className="hidden text-[11px] font-semibold text-ink-300 ipad:inline">{meta}</span>
      ) : null}
    </header>
  );
}

function SettingsRow({ href, label, description, icon: Icon }: SettingLink) {
  return (
    <Link href={href} className="group block">
      <Card className="flex items-center gap-4 transition-colors group-hover:border-mostaza-300 ipad:min-h-24 ipad:p-5">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-mostaza-50 text-mostaza-700 transition-colors group-hover:bg-white group-hover:ring-1 group-hover:ring-mostaza-300">
          <Icon className="size-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink-900">{label}</p>
          <p className="mt-0.5 truncate text-xs text-ink-500">{description}</p>
        </div>
        <ChevronRight
          size={18}
          className="text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-mostaza-600"
        />
      </Card>
    </Link>
  );
}

function ProRow({
  icon: Icon,
  label,
  description,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
}) {
  return (
    <Card className="flex items-center gap-4 border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm ipad:min-h-24 ipad:p-5">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-mostaza-700 ring-1 ring-mostaza-300">
        <Icon className="size-5" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink-900">{label}</p>
        <p className="mt-0.5 text-xs text-ink-600">{description}</p>
      </div>
      <ProBadge />
    </Card>
  );
}
