'use client';
import { Home, BookOpen, BarChart3, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProBadge, ProFeatureLock } from '@/components/admin/pro-feature-lock';
import { FudiLogo } from '@/components/brand/fudi-logo';
import { cn } from '@/lib/utils';
import type { Plan } from '@/types/domain';

const links = [
  { href: '/dashboard', label: 'Inicio', Icon: Home },
  { href: '/menu', label: 'Menú', Icon: BookOpen },
  { href: '/analytics', label: 'Stats', Icon: BarChart3 },
  { href: '/settings', label: 'Ajustes', Icon: Settings },
];

type SidebarNavProps = {
  plan: Plan;
};

export function SidebarNav({ plan }: SidebarNavProps) {
  const pathname = usePathname();
  const isFree = plan === 'free';

  return (
    <aside className="hidden ipad-landscape:flex ipad-landscape:w-60 desktop:w-64 flex-col border-r border-[var(--brand-card-border)] bg-[var(--brand-card)]">
      <div className="px-6 py-7">
        <FudiLogo markClassName="h-10 w-10 rounded-lg" textClassName="text-lg" />
      </div>

      {/* Navigation links */}
      <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {links.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const isAnalyticsLocked = isFree && href === '/analytics';

          if (isAnalyticsLocked) {
            return (
              <ProFeatureLock
                key={href}
                title="Analytics es Pro"
                description="Mide vistas, platillos favoritos y señales de demanda para decidir qué vender más."
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  active
                    ? 'bg-[var(--brand-primary-faint)] text-[var(--brand-primary)]'
                    : 'text-ink-500 hover:bg-[var(--brand-primary-faint)] hover:text-ink-700',
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
                <span className="ml-auto">
                  <ProBadge />
                </span>
              </ProFeatureLock>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                active
                  ? 'bg-[var(--brand-primary-faint)] text-[var(--brand-primary)] shadow-sm'
                  : 'text-ink-500 hover:bg-[var(--brand-primary-faint)] hover:text-ink-700',
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--brand-card-border)] px-6 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-surface-strong)] text-sm font-black text-ink-700">
          FM
        </div>
        <p className="mt-2 text-xs font-medium text-ink-500">Tu menú vive online.</p>
      </div>
    </aside>
  );
}
