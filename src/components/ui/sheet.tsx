'use client';
import { X } from 'lucide-react';
import { Drawer } from 'vaul';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, title, children }: SheetProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    if (!open) return null;
    return (
      <dialog
        ref={(dialog) => {
          if (dialog && !dialog.open) dialog.showModal();
        }}
        className="z-50 m-auto w-full max-w-lg rounded-xl bg-[var(--brand-card)] p-0 shadow-xl backdrop:bg-ink-900/45 backdrop:backdrop-blur-sm"
        aria-label={title}
        onCancel={() => onOpenChange(false)}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) onOpenChange(false);
        }}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          {title ? <h2 className="text-xl font-bold text-ink-900">{title}</h2> : <span />}
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => onOpenChange(false)}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-6 pb-6 pt-4">{children}</div>
      </dialog>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[95vh] flex-col rounded-t-xl bg-[var(--brand-card)] pb-safe shadow-xl',
          )}
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-ink-300" />
          {title && (
            <Drawer.Title className="px-6 py-4 text-xl font-bold text-ink-900">
              {title}
            </Drawer.Title>
          )}
          <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
