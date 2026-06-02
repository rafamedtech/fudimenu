'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProBadge, ProFeatureLock } from '@/components/admin/pro-feature-lock';
import { NAV_ICONS_PRIMARY } from '@/components/layout/nav-data';
import {
  getIntentPrefetchHandlers,
  usePrefetchRoute,
} from '@/components/layout/route-prefetch';
import { cn } from '@/lib/utils';
import type { Plan } from '@/types/domain';

type BottomNavProps = {
  plan: Plan;
};

export function BottomNav({ plan }: BottomNavProps) {
  const pathname = usePathname();
  const isFree = plan === 'free';
  const prefetchRoute = usePrefetchRoute();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-4 right-4 z-30 mx-auto max-w-[480px] rounded-xl border border-[var(--brand-card-border)] bg-[rgb(var(--brand-card-rgb)/0.95)] p-2 shadow-lg backdrop-blur-md ipad:max-w-[720px] ipad:p-2.5 ipad-landscape:hidden"
    >
      <ul className="grid h-14 grid-cols-4 gap-1 ipad:h-16 ipad:gap-2">
        {NAV_ICONS_PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const isAnalyticsLocked = isFree && href === '/analytics';
          const itemClassName = cn(
            'relative flex h-full flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-semibold leading-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-primary-ring)] ipad:text-xs',
            active
              ? 'bg-[var(--brand-primary-faint)] text-[var(--brand-primary)] shadow-sm'
              : 'text-ink-500 hover:bg-[var(--brand-primary-faint)] hover:text-ink-700',
          );

          if (isAnalyticsLocked) {
            return (
              <li key={href} className="min-w-0">
                <ProFeatureLock
                  title="Analytics es Pro"
                  description="Mide vistas, platillos favoritos y señales de demanda para decidir qué vender más."
                  className={cn(itemClassName, 'w-full')}
                >
                  <Icon className="size-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                  <span className="max-w-full truncate">{label}</span>
                  <span className="absolute -right-1 -top-1 scale-75 ipad:right-0 ipad:top-0">
                    <ProBadge />
                  </span>
                </ProFeatureLock>
              </li>
            );
          }

          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                prefetch
                {...getIntentPrefetchHandlers(href, prefetchRoute)}
                className={itemClassName}
              >
                <Icon className="size-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
