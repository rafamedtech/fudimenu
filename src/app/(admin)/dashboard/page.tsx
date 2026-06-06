import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton, StatCardSkeleton } from '@/components/ui/skeleton';
import { ProFeatureLock, ProBadge } from '@/components/admin/pro-feature-lock';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { Doodle } from '@/components/brand/doodles';
import { AppHeader } from '@/components/layout/app-header';
import { buildActivationChecklist, type ActivationChecklist } from '@/lib/activation-checklist';
import { formatPrice } from '@/lib/utils';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';
import { getTenantAnalyticsStats } from '@/server/services/posthog-analytics.service';
import { getTenantQrDownloadedAt } from '@/server/services/qr-activation.service';
import type { MenuItem, Plan, Tenant } from '@/types/domain';
import { CheckCircle2, ChevronRight, Circle, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function findDailySpecial(items: MenuItem[]) {
  return items.find((item) => item.isAvailable && item.isSpecialToday) ?? null;
}

function getLogoFrameClass(shape: Tenant['logoShape']) {
  if (shape === 'rectangular') {
    return 'h-32 w-full rounded-2xl desktop:h-40 desktop:w-72';
  }

  if (shape === 'square') {
    return 'h-32 w-32 rounded-2xl desktop:h-40 desktop:w-40';
  }

  return 'h-32 w-32 rounded-full desktop:h-40 desktop:w-40';
}

const COUNT_FORMATTER = new Intl.NumberFormat('es-MX');

function formatCount(value: number) {
  return COUNT_FORMATTER.format(value);
}

function formatDelta(value: number | null, period: 'ayer' | 'semana pasada') {
  if (value === null) return `Sin comparativo vs ${period}`;
  return `${value >= 0 ? '▲' : '▼'} ${value >= 0 ? '+' : ''}${value}% vs ${period}`;
}

function ActionCard({
  href,
  title,
  description,
  doodle,
  imageSrc,
  imageAlt,
  target,
}: {
  href: string;
  title: string;
  description: string;
  doodle?: React.ComponentProps<typeof Doodle>['name'];
  imageSrc?: string;
  imageAlt?: string;
  target?: '_blank';
}) {
  return (
    <Link
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className="group relative min-h-44 overflow-hidden rounded-2xl border-[1.5px] border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5 shadow-md transition-all hover:-translate-y-0.5 hover:border-[var(--brand-primary-border)] hover:shadow-lg active:scale-[0.99] ipad:min-h-52 ipad:p-6"
    >
      <div className="relative z-10 max-w-[72%]">
        <p className="font-heading text-xl font-black text-ink-900 ipad:text-2xl">{title}</p>
        <p className="mt-2 text-sm leading-6 text-ink-500">{description}</p>
      </div>
      {imageSrc ? (
        <div className="absolute -bottom-7 right-3 h-[9.1rem] w-[6.3rem] overflow-hidden transition-transform group-hover:scale-105 ipad:-bottom-10 ipad:right-5 ipad:h-[11.2rem] ipad:w-[7.7rem]">
          <Image
            src={imageSrc}
            alt={imageAlt ?? ''}
            fill
            sizes="(min-width: 768px) 176px, 144px"
            className="object-cover object-center grayscale"
          />
        </div>
      ) : doodle ? (
        <Doodle
          name={doodle}
          className="absolute -bottom-6 -right-10 h-36 w-44 opacity-95 transition-transform group-hover:scale-105 ipad:-bottom-8 ipad:-right-12 ipad:h-44 ipad:w-56"
        />
      ) : null}
    </Link>
  );
}

export default async function DashboardPage() {
  const ctx = await requireAuth();

  return (
    <>
      <AppHeader
        title="Inicio"
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <Suspense fallback={<DashboardContentLoading />}>
        <DashboardContent tenantId={ctx.tenantId} plan={ctx.plan} />
      </Suspense>
    </>
  );
}

async function DashboardContent({ tenantId, plan }: { tenantId: string; plan: Plan }) {
  const [{ tenant, items, categories, sections }, qrDownloadedAt] = await Promise.all([
    menuService.getCachedMenuByTenantId(tenantId),
    getTenantQrDownloadedAt(tenantId),
  ]);
  const dailySpecial = findDailySpecial(items);
  const total = items.length;
  const agotados = items.filter((i) => !i.isAvailable).length;
  const activeSlug = tenant.slug;
  const activationChecklist = buildActivationChecklist({
    tenant,
    qrDownloadedAt,
    items,
    categories,
    sections,
  });

  return (
      <main className="flex flex-col gap-4 px-4 pb-6 ipad:gap-5 ipad:px-6 ipad:pb-8 ipad-landscape:px-7 desktop:px-8">
        <div className="relative overflow-hidden rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5 shadow-md ipad:p-7">
          <div className="flex flex-col items-center gap-5 desktop:flex-row desktop:items-center desktop:gap-7">
            <div
              className={`relative flex shrink-0 items-center justify-center overflow-hidden border-[1.5px] border-[var(--brand-card-border)] bg-[var(--brand-surface-strong)] shadow-sm ${getLogoFrameClass(tenant.logoShape)}`}
            >
              {tenant.logoUrl ? (
                <Image
                  src={tenant.logoUrl}
                  alt={`Logo de ${tenant.name}`}
                  fill
                  sizes="(min-width: 1024px) 288px, 100vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-500">
                  <ImageIcon className="h-8 w-8 ipad:h-10 ipad:w-10" aria-hidden="true" />
                  <span className="px-2 text-center text-[10px] font-bold uppercase tracking-wider">
                    Logo
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col text-center desktop:text-left">
              <span className="font-heading text-xl font-bold leading-tight text-ink-700 ipad:text-2xl desktop:text-3xl">
                Bienvenido a
              </span>
              <h2 className="font-heading text-3xl font-black leading-tight text-[var(--brand-primary)] ipad:text-5xl ipad-landscape:text-6xl">
                {tenant.name}
              </h2>
            </div>
          </div>
        </div>

        <ActivationChecklistPanel checklist={activationChecklist} />

        {plan === 'free' ? (
          <ProFeatureLock
            title="Analytics es Pro"
            description="Desbloquea vistas del día, tendencias semanales y top platillos para saber qué se está moviendo."
            className="block"
          >
            <Card className="border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm ipad:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink-500">Vistas hoy</p>
                <ProBadge />
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-700">
                Toca para activar analytics y ver qué platillos están ganando atención.
              </p>
            </Card>
          </ProFeatureLock>
        ) : (
          <Suspense fallback={<DashboardAnalyticsLoading />}>
            <DashboardAnalyticsCards tenantId={tenantId} />
          </Suspense>
        )}

        <div className="grid gap-3 ipad:grid-cols-3 ipad:gap-4">
          <ActionCard
            href="/qr"
            title="Compartir QR"
            description="Descarga, imprime o manda el QR de tu menú."
            imageSrc="/dashboard/share-qr.png"
            imageAlt="Teléfono escaneando un código QR"
          />
          <ActionCard
            href={`/m/${activeSlug}`}
            target="_blank"
            title="Ver mi menú público"
            description="Abre la vista que ven tus clientes al escanear."
            imageSrc="/dashboard/public-menu.png"
            imageAlt="Teléfono mostrando el menú público del restaurante"
          />
          <ActionCard
            href={dailySpecial ? `/menu/${dailySpecial.id}` : '/menu'}
            title="Especial de hoy"
            description={
              dailySpecial
                ? `${dailySpecial.name} · ${formatPrice(
                    dailySpecial.specialPrice ?? dailySpecial.priceCents,
                    dailySpecial.currency,
                  )}`
                : 'Elige el platillo que quieres empujar hoy.'
            }
            imageSrc="/dashboard/especial-de-hoy.png"
            imageAlt="Teléfono mostrando el especial de hoy"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 ipad:gap-4 ipad-landscape:grid-cols-4">
          <Card className="p-4 ipad:p-5">
            <p className="text-xs text-ink-500">Items totales</p>
            <p className="text-2xl font-bold tabular-nums ipad:text-3xl">{total}</p>
          </Card>
          <Card className="p-4 ipad:p-5">
            <p className="text-xs text-ink-500">Agotados</p>
            <p className="text-2xl font-bold tabular-nums text-coral-500 ipad:text-3xl">{agotados}</p>
          </Card>
          <Card className="p-4 ipad:p-5">
            <p className="text-xs text-ink-500">Categorías</p>
            <p className="text-2xl font-bold tabular-nums ipad:text-3xl">{categories.length}</p>
          </Card>
          <Card className="p-4 ipad:p-5">
            <p className="text-xs text-ink-500">Secciones</p>
            <p className="text-2xl font-bold tabular-nums ipad:text-3xl">{sections.length}</p>
          </Card>
        </div>
      </main>
  );
}

function ActivationChecklistPanel({ checklist }: { checklist: ActivationChecklist }) {
  const isComplete = checklist.completedCount === checklist.totalCount;

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] shadow-md">
      <div className="grid gap-0 ipad-landscape:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="p-4 ipad:p-5 ipad-landscape:p-6">
          <div className="flex flex-col gap-3 ipad:flex-row ipad:items-start ipad:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-[var(--brand-accent-text)]">
                Activación pública
              </p>
              <h2 className="mt-1 text-xl font-black leading-tight text-ink-900 ipad:text-2xl">
                Checklist para publicar con confianza
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-500">
                Enfocado en lo que ve el comensal cuando abre tu menú o escanea el QR.
              </p>
            </div>
            <div className="shrink-0 rounded-lg bg-[var(--brand-surface-strong)] px-3 py-2 text-left ipad:text-right">
              <p className="text-[11px] font-black uppercase tracking-wider text-ink-500">
                Progreso
              </p>
              <p className="text-2xl font-black tabular-nums text-ink-900">
                {checklist.completedCount}/{checklist.totalCount}
              </p>
            </div>
          </div>

          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--brand-surface-strong)]"
            role="progressbar"
            aria-valuenow={checklist.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progreso de activación pública"
          >
            <div
              className="h-full rounded-full bg-menta-500 transition-all"
              style={{ width: `${checklist.percent}%` }}
            />
          </div>

          <ul className="mt-4 grid gap-2 ipad:grid-cols-2">
            {checklist.items.map((item) => {
              const Icon = item.completed ? CheckCircle2 : Circle;

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="group flex min-h-20 items-start gap-3 rounded-lg border border-[var(--brand-card-border)] bg-[var(--brand-surface)] p-3 transition-colors hover:border-[var(--brand-primary-border)] hover:bg-[var(--brand-primary-faint)]"
                  >
                    <Icon
                      className={`mt-0.5 size-5 shrink-0 ${
                        item.completed ? 'text-menta-600' : 'text-ink-300'
                      }`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold text-ink-900">{item.title}</span>
                        {item.metric ? (
                          <span className="shrink-0 text-[11px] font-bold text-ink-400">
                            {item.metric}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-ink-500">
                        {item.description}
                      </span>
                    </span>
                    <ChevronRight
                      className="mt-0.5 size-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--brand-accent-text)]"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-[var(--brand-card-border)] bg-[var(--brand-surface-strong)] p-4 ipad:p-5 ipad-landscape:border-l ipad-landscape:border-t-0 ipad-landscape:p-6">
          <p className="text-[11px] font-black uppercase tracking-wider text-ink-500">
            Siguiente paso
          </p>
          {isComplete ? (
            <>
              <p className="mt-2 text-lg font-black leading-tight text-ink-900">Menú activado</p>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                Tu menú público ya tiene identidad, contacto, fotos, QR y especial.
              </p>
              <Link
                href="/qr"
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-[var(--brand-primary-border)] bg-[var(--brand-card)] px-4 text-sm font-extrabold text-ink-900 shadow-sm transition-all hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-faint)]"
              >
                Compartir QR
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg font-black leading-tight text-ink-900">
                {checklist.nextItem?.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                {checklist.nextItem?.description}
              </p>
              <Link
                href={checklist.nextItem?.href ?? '/menu'}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 text-sm font-extrabold text-[var(--brand-on-primary)] shadow-mostaza-sm transition-all hover:bg-[var(--brand-primary-hover)] hover:shadow-mostaza-md"
              >
                Completar paso
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

async function DashboardAnalyticsCards({ tenantId }: { tenantId: string }) {
  const analyticsStats = await getTenantAnalyticsStats(tenantId);
  const topItem = analyticsStats.topItems[0] ?? null;

  return (
    <div className="grid gap-3 ipad:grid-cols-2 ipad:gap-4">
      <Card className="bg-gradient-to-br from-mostaza-50 to-[var(--brand-card)] ipad:p-5 ipad-landscape:p-6">
        <p className="text-sm font-medium text-ink-500">Vistas hoy</p>
        <p className="mt-1 text-4xl font-extrabold tabular-nums">
          {formatCount(analyticsStats.todayViews)}
        </p>
        <p
          className={`mt-1 text-sm ${
            (analyticsStats.todayDeltaPercent ?? 0) >= 0 ? 'text-menta-500' : 'text-coral-500'
          }`}
        >
          {analyticsStats.status === 'missing_config'
            ? 'PostHog no configurado'
            : analyticsStats.status === 'error'
              ? 'No pudimos leer PostHog'
              : formatDelta(analyticsStats.todayDeltaPercent, 'ayer')}
        </p>
      </Card>
      <Card className="ipad:p-5">
        <p className="text-sm font-medium text-ink-700">Top platillo esta semana</p>
        {topItem ? (
          <>
            <p className="mt-1 truncate text-lg font-bold">{topItem.name}</p>
            <p className="text-sm text-ink-500">{formatCount(topItem.views)} vistas</p>
          </>
        ) : (
          <p className="mt-1 text-sm leading-6 text-ink-600">
            Todavía no hay vistas de platillos esta semana.
          </p>
        )}
      </Card>
    </div>
  );
}

function DashboardAnalyticsLoading() {
  return (
    <div className="grid gap-3 ipad:grid-cols-2 ipad:gap-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  );
}

function DashboardContentLoading() {
  return (
    <main className="flex flex-col gap-4 px-4 pb-6 ipad:gap-5 ipad:px-6 ipad:pb-8 ipad-landscape:px-7 desktop:px-8">
      <div className="rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5 shadow-md ipad:p-7">
        <div className="flex flex-col items-center gap-5 desktop:flex-row desktop:items-center desktop:gap-7">
          <Skeleton className="h-32 w-full rounded-2xl desktop:h-40 desktop:w-72" />
          <div className="flex w-full flex-col items-center gap-3 desktop:items-start">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-56 ipad:h-14 ipad:w-80" />
          </div>
        </div>
      </div>
      <div className="grid gap-3 ipad:grid-cols-2 ipad:gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid gap-3 ipad:grid-cols-3 ipad:gap-4">
        <Skeleton className="h-44 rounded-2xl ipad:h-52" />
        <Skeleton className="h-44 rounded-2xl ipad:h-52" />
        <Skeleton className="h-44 rounded-2xl ipad:h-52" />
      </div>
      <div className="grid grid-cols-2 gap-3 ipad:gap-4 ipad-landscape:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    </main>
  );
}
