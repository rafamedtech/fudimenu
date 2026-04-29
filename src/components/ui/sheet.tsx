'use client';
import { Drawer } from 'vaul';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, title, children }: SheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[95vh] flex-col rounded-t-xl bg-white pb-safe shadow-xl',
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
