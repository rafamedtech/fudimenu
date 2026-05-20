'use client';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProBadge, ProFeatureLock } from '@/components/admin/pro-feature-lock';
import { FudiLogo } from '@/components/brand/fudi-logo';
import { NAV_DATA, type NavItem } from '@/components/layout/nav-data';
import { useSidebarContext } from '@/components/layout/sidebar-context';
import { cn } from '@/lib/utils';
import type { Plan } from '@/types/domain';

type SidebarNavProps = {
  plan: Plan;
};

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.url) return pathname === item.url || pathname.startsWith(`${item.url}/`);
  return !!item.items?.some((sub) => pathname === sub.url || pathname.startsWith(`${sub.url}/`));
}

export function SidebarNav({ plan }: SidebarNavProps) {
  const pathname = usePathname();
  const { isOpen } = useSidebarContext();
  const isFree = plan === 'free';
  const [expanded, setExpanded] = useState<string[]>([]);

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
        'hidden ipad-landscape:flex flex-col border-r border-[var(--brand-card-border)] bg-[var(--brand-card)] transition-[width] duration-200 ease-linear',
        isOpen ? 'ipad-landscape:w-60 desktop:w-64' : 'ipad-landscape:w-[76px]',
      )}
      aria-label="Navegación principal"
    >
      <div className={cn('flex items-center px-6 py-7', !isOpen && 'justify-center px-2')}>
        {isOpen ? (
          <FudiLogo markClassName="h-14" textClassName="text-lg" />
        ) : (
          <FudiLogo markClassName="h-10" showText={false} />
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pt-2 pb-4">
        {NAV_DATA.map((section) => (
          <div key={section.label}>
            {isOpen && (
              <h2 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                {section.label}
              </h2>
            )}
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => {
                const active = isItemActive(pathname, item);
                const hasSub = !!item.items?.length;
                const isExpanded = expanded.includes(item.title);
                const locked = isFree && item.proOnly === true;
                const Icon = item.icon;

                const baseRow = cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  active
                    ? 'bg-[var(--brand-primary-faint)] text-[var(--brand-primary)] shadow-sm'
                    : 'text-ink-500 hover:bg-[var(--brand-primary-faint)] hover:text-ink-700',
                  !isOpen && 'justify-center px-2',
                );

                const iconNode = <Icon size={20} strokeWidth={active ? 2.5 : 2} />;

                if (locked && item.url) {
                  return (
                    <li key={item.title}>
                      <ProFeatureLock
                        title="Analytics es Pro"
                        description="Mide vistas, platillos favoritos y señales de demanda para decidir qué vender más."
                        className={cn(baseRow, 'relative')}
                      >
                        {iconNode}
                        {isOpen && (
                          <>
                            <span>{item.title}</span>
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
                            <span>{item.title}</span>
                            <ChevronDown
                              size={16}
                              className={cn(
                                'ml-auto transition-transform duration-200',
                                isExpanded && 'rotate-180',
                              )}
                            />
                          </>
                        )}
                      </button>
                      {isOpen && isExpanded && item.items && (
                        <ul className="mt-1 ml-4 flex flex-col gap-1 border-l border-[var(--brand-card-border)] pl-3">
                          {item.items.map((sub) => {
                            const subActive =
                              pathname === sub.url || pathname.startsWith(`${sub.url}/`);
                            return (
                              <li key={sub.url}>
                                <Link
                                  href={sub.url}
                                  className={cn(
                                    'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    subActive
                                      ? 'text-[var(--brand-primary)]'
                                      : 'text-ink-500 hover:text-ink-700',
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
                      className={baseRow}
                      title={!isOpen ? item.title : undefined}
                    >
                      {iconNode}
                      {isOpen && <span>{item.title}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {isOpen && (
        <div className="border-t border-[var(--brand-card-border)] px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-surface-strong)] text-sm font-black text-ink-700">
            FM
          </div>
          <p className="mt-2 text-xs font-medium text-ink-500">Tu menú vive online.</p>
        </div>
      )}
    </aside>
  );
}
