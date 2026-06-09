'use client';
import { PanelLeft } from 'lucide-react';
import { useSidebarContext } from '@/components/layout/sidebar-context';
import { Button } from '@/components/ui/button';

export function SidebarToggle() {
  const { toggleSidebar, state } = useSidebarContext();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      aria-label={state === 'expanded' ? 'Colapsar menú lateral' : 'Expandir menú lateral'}
      aria-pressed={state === 'expanded'}
      className="hidden size-10 rounded-lg text-ink-700 hover:text-ink-900 ipad-landscape:inline-flex"
    >
      <PanelLeft size={20} />
    </Button>
  );
}
