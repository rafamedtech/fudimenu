'use client';
import { Home, BookOpen, BarChart3, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProBadge, ProFeatureLock } from '@/components/admin/pro-feature-lock';
import { cn } from '@/lib/utils';
import type { Plan } from '@/types/domain';

const tabs = [
  { href: '/dashboard', label: 'Inicio', Icon: Home },
  { href: '/menu', label: 'Menú', Icon: BookOpen },
  { href: '/analytics', label: 'Stats', Icon: BarChart3 },
  { href: '/settings', label: 'Ajustes', Icon: Settings },
];

type BottomNavProps = {
  plan: Plan;
};

export function BottomNav({ plan }: BottomNavProps) {
  const pathname = usePathname();
  const isFree = plan === 'free';

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/90 pb-safe backdrop-blur"
    >
      <ul className="mx-auto flex h-[72px] max-w-md items-center justify-around">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const isAnalyticsLocked = isFree && href === '/analytics';

          if (isAnalyticsLocked) {
            return (
              <li key={href}>
                <ProFeatureLock
                  title="Analytics es Pro"
                  description="Mide vistas, platillos favoritos y señales de demanda para decidir qué vender más."
                  className={cn(
                    'relative flex flex-col items-center gap-1 px-3 py-2 transition-transform',
                    active ? 'scale-110 text-mostaza-500' : 'text-ink-500',
                  )}
                >
                  <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                  <span className={cn('text-[11px]', active && 'font-semibold')}>{label}</span>
                  <span className="absolute -right-1 -top-1">
                    <ProBadge />
                  </span>
                </ProFeatureLock>
              </li>
            );
          }

          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 transition-transform',
                  active ? 'text-mostaza-500 scale-110' : 'text-ink-500',
                )}
              >
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                <span className={cn('text-[11px]', active && 'font-semibold')}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
