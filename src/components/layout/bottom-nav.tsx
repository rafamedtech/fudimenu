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
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-4 right-4 z-30 mx-auto max-w-[480px] rounded-full border border-[var(--brand-card-border)] bg-[var(--brand-card)]/95 backdrop-blur-md shadow-lg ipad:max-w-[720px] ipad-landscape:hidden"
    >
      <ul className="flex h-[72px] items-center justify-around px-2 ipad:h-20">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const isAnalyticsLocked = isFree && href === '/analytics';
 
          if (isAnalyticsLocked) {
            return (
              <li key={href} className="flex-1">
                <ProFeatureLock
                  title="Analytics es Pro"
                  description="Mide vistas, platillos favoritos y señales de demanda para decidir qué vender más."
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-0.5 py-1 transition-all rounded-full',
                    active ? 'text-[var(--brand-primary)] scale-105' : 'text-ink-500 hover:text-ink-700',
                  )}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  <span className={cn('text-[10px]', active && 'font-bold')}>{label}</span>
                  <span className="absolute right-1/4 top-1">
                    <ProBadge />
                  </span>
                </ProFeatureLock>
              </li>
            );
          }
 
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-1 transition-all rounded-full',
                  active ? 'text-[var(--brand-primary)] scale-105' : 'text-ink-500 hover:text-ink-700',
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className={cn('text-[10px]', active && 'font-bold')}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
