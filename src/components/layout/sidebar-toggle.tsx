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
      className="hidden h-10 w-10 items-center justify-center rounded-lg text-ink-700 hover:bg-[var(--brand-primary-faint)] ipad-landscape:inline-flex"
    >
      <PanelLeft size={20} />
    </button>
  );
}
