'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function DialogFrame({ className, ref, ...props }: React.ComponentPropsWithRef<'dialog'>) {
  return (
    <dialog
      ref={ref}
      className={cn(
        'z-50 m-auto rounded-xl bg-[var(--brand-card)] p-0 text-ink-900 shadow-xl backdrop:bg-ink-900/45 backdrop:backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  );
}

interface DialogProps extends React.DialogHTMLAttributes<HTMLDialogElement> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  contentClassName?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  contentClassName,
  ...props
}: DialogProps) {
  if (!open) return null;

  return (
    <dialog
      ref={(dialog) => {
        if (dialog && !dialog.open) dialog.showModal();
      }}
      className={cn(
        'z-50 m-auto w-[min(calc(100vw-2rem),32rem)] rounded-xl bg-[var(--brand-card)] p-0 text-ink-900 shadow-xl backdrop:bg-ink-900/45 backdrop:backdrop-blur-sm',
        className,
      )}
      onCancel={() => onOpenChange(false)}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
      {...props}
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-5">
        <div className="space-y-1">
          {title ? <h2 className="text-xl font-bold text-ink-900">{title}</h2> : null}
          {description ? <p className="text-sm text-ink-500">{description}</p> : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Cerrar"
          onClick={() => onOpenChange(false)}
          className="size-8 text-ink-500 hover:text-ink-900"
        >
          <X className="size-5" aria-hidden />
        </Button>
      </div>
      <div className={cn('max-h-[80vh] overflow-y-auto px-6 pb-6 pt-4', contentClassName)}>
        {children}
      </div>
    </dialog>
  );
}
