'use client';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProBadge, ProFeatureLock } from '@/components/admin/pro-feature-lock';
import { FudiLogo } from '@/components/brand/fudi-logo';
import { NAV_DATA, type NavItem } from '@/components/layout/nav-data';
import {
  getIntentPrefetchHandlers,
  usePrefetchRoute,
} from '@/components/layout/route-prefetch';
import { useSidebarContext } from '@/components/layout/sidebar-context';
import { SidebarToggle } from '@/components/layout/sidebar-toggle';
import { cn } from '@/lib/utils';
import type { Plan } from '@/types/domain';

type SidebarNavProps = {
  plan: Plan;
  tenantName: string;
  avatarUrl: string | null;
};

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.url) return pathname === item.url || pathname.startsWith(`${item.url}/`);
  return !!item.items?.some((sub) => pathname === sub.url || pathname.startsWith(`${sub.url}/`));
}

function getPlanLabel(plan: Plan) {
  return plan === 'free' ? 'Free' : 'Pro';
}

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || 'F';
}

export function SidebarNav({ plan, tenantName, avatarUrl }: SidebarNavProps) {
  const pathname = usePathname();
  const { isOpen } = useSidebarContext();
  const isFree = plan === 'free';
  const [expanded, setExpanded] = useState<string[]>([]);
  const prefetchRoute = usePrefetchRoute();

  useEffect(() => {
    NAV_DATA.forEach((section) =>
      section.items.forEach((item) => {
        if (item.items?.some((sub) => pathname === sub.url || pathname.startsWith(`${sub.url}/`))) {
          setExpanded((prev) => (prev.includes(item.title) ? prev : [...prev, item.title]));
        }
      }),
    );
  }, [pathname]);

  const toggleExpanded = (title: string) =>
    setExpanded((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]));

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 self-start overflow-hidden ipad-landscape:flex flex-col border-r border-[var(--brand-card-border)] bg-[rgb(var(--brand-card-rgb)/0.95)] shadow-sm backdrop-blur-md transition-[width] duration-200 ease-linear',
        isOpen ? 'ipad-landscape:w-60 desktop:w-64' : 'ipad-landscape:w-[76px]',
      )}
      aria-label="Navegación principal"
    >
      <div
        className={cn(
          'flex min-h-[92px] items-center border-b border-[var(--brand-card-border)] px-5 py-5',
          !isOpen && 'justify-center px-2',
        )}
      >
        {isOpen ? (
          <FudiLogo markClassName="h-12" textClassName="text-lg" />
        ) : (
          <FudiLogo markClassName="h-10" showText={false} />
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
        {NAV_DATA.map((section) => (
          <div key={section.label}>
            {isOpen && section.label && (
              <h2 className="mb-2 px-3 text-[11px] font-extrabold uppercase tracking-wider text-ink-500">
                {section.label}
              </h2>
            )}
            <ul className="flex flex-col gap-1.5">
              {section.items.filter((item) => item.url !== '/account').map((item) => {
                const active = isItemActive(pathname, item);
                const hasSub = !!item.items?.length;
                const isExpanded = expanded.includes(item.title);
                const locked = isFree && item.proOnly === true;
                const Icon = item.icon;

                const baseRow = cn(
                  'flex min-h-11 items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-primary-ring)]',
                  active
                    ? 'bg-[var(--brand-primary-faint)] text-[var(--brand-primary)] shadow-sm'
                    : 'text-ink-500 hover:bg-[var(--brand-primary-faint)] hover:text-ink-700',
                  !isOpen && 'justify-center px-2',
                );

                const iconNode = <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />;

                if (locked && item.url) {
                  return (
                    <li key={item.title} className="w-full">
                      <ProFeatureLock
                        title="Analytics es Pro"
                        description="Mide vistas, platillos favoritos y señales de demanda para decidir qué vender más."
                        className={cn(baseRow, 'relative w-full')}
                      >
                        {iconNode}
                        {isOpen && (
                          <>
                            <span className="min-w-0 flex-1 truncate">{item.title}</span>
                            <span className="ml-auto">
                              <ProBadge />
                            </span>
                          </>
                        )}
                      </ProFeatureLock>
                    </li>
                  );
                }

                if (hasSub) {
                  return (
                    <li key={item.title}>
                      <button
                        type="button"
                        onClick={() => isOpen && toggleExpanded(item.title)}
                        aria-expanded={isExpanded}
                        className={cn(baseRow, 'w-full')}
                        title={!isOpen ? item.title : undefined}
                      >
                        {iconNode}
                        {isOpen && (
                          <>
                            <span className="min-w-0 flex-1 truncate">{item.title}</span>
                            <ChevronDown
                              size={16}
                              className={cn(
                                'ml-auto shrink-0 transition-transform duration-200',
                                isExpanded && 'rotate-180',
                              )}
                            />
                          </>
                        )}
                      </button>
                      {isOpen && isExpanded && item.items && (
                        <ul className="mt-1.5 ml-5 flex flex-col gap-1 border-l border-[var(--brand-card-border)] pl-3">
                          {item.items.map((sub) => {
                            const subActive =
                              pathname === sub.url || pathname.startsWith(`${sub.url}/`);
                            return (
                              <li key={sub.url}>
                                <Link
                                  href={sub.url}
                                  aria-current={subActive ? 'page' : undefined}
                                  prefetch
                                  {...getIntentPrefetchHandlers(sub.url, prefetchRoute)}
                                  className={cn(
                                    'block rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-primary-ring)]',
                                    subActive
                                      ? 'bg-[var(--brand-primary-faint)] text-[var(--brand-primary)]'
                                      : 'text-ink-500 hover:bg-[var(--brand-primary-faint)] hover:text-ink-700',
                                  )}
                                >
                                  {sub.title}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={item.title}>
                    <Link
                      href={item.url!}
                      aria-current={active ? 'page' : undefined}
                      prefetch
                      {...getIntentPrefetchHandlers(item.url!, prefetchRoute)}
                      className={baseRow}
                      title={!isOpen ? item.title : undefined}
                    >
                      {iconNode}
                      {isOpen && <span className="min-w-0 flex-1 truncate">{item.title}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn('px-3 pb-2', isOpen ? 'flex justify-start' : 'flex justify-center')}>
        <SidebarToggle />
      </div>

      <div className="border-t border-[var(--brand-card-border)] p-3">
        <Link
          href="/account"
          prefetch
          {...getIntentPrefetchHandlers('/account', prefetchRoute)}
          className={cn(
            'flex items-center rounded-lg bg-[var(--brand-surface-strong)] p-2 transition-all duration-200 hover:bg-[var(--brand-primary-faint)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-primary-ring)]',
            isOpen ? 'gap-3' : 'justify-center',
          )}
          title={!isOpen ? 'Cuenta' : undefined}
        >
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--brand-primary-faint)] bg-cover bg-center text-sm font-black text-[var(--brand-primary)]',
              avatarUrl && 'text-transparent',
            )}
            style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
            aria-hidden="true"
          >
            {avatarUrl ? null : getInitial(tenantName)}
          </span>
          {isOpen && (
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 block text-sm font-extrabold leading-4 text-ink-900">
                {tenantName}
              </span>
            </span>
          )}
          {isOpen && (
            <span className="rounded-full bg-ink-900 px-2 py-1 text-[11px] font-extrabold text-mostaza-500">
              {getPlanLabel(plan)}
            </span>
          )}
        </Link>
      </div>
    </aside>
  );
}
