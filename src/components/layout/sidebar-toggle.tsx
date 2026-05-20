'use client';
import { PanelLeft } from 'lucide-react';
import { useSidebarContext } from '@/components/layout/sidebar-context';

export function SidebarToggle() {
  const { toggleSidebar, state } = useSidebarContext();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={state === 'expanded' ? 'Colapsar menú lateral' : 'Expandir menú lateral'}
      aria-pressed={state === 'expanded'}
      className="hidden h-10 w-10 items-center justify-center rounded-lg text-ink-700 transition-colors hover:bg-[var(--brand-primary-faint)] hover:text-ink-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-primary-ring)] ipad-landscape:inline-flex"
    >
      <PanelLeft size={20} />
    </button>
  );
}
