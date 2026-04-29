'use client';
import { Home, BookOpen, BarChart3, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/dashboard', label: 'Inicio', Icon: Home },
  { href: '/menu', label: 'Menú', Icon: BookOpen },
  { href: '/analytics', label: 'Stats', Icon: BarChart3 },
  { href: '/settings', label: 'Ajustes', Icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/90 pb-safe backdrop-blur"
    >
      <ul className="mx-auto flex h-[72px] max-w-md items-center justify-around">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
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
