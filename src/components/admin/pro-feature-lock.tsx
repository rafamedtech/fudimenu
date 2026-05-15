'use client';

import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Sheet } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type ProFeatureLockProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
  label?: string;
};

export function ProFeatureLock({
  title,
  description,
  children,
  className,
  label = '✨ Pro',
}: ProFeatureLockProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('group text-left', className)}
        aria-label={`${title}. Requiere Pro`}
      >
        {children ?? (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink-900 px-2.5 py-1 text-xs font-extrabold text-mostaza-500 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {label.replace('✨ ', '')}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen} title="Desbloquea Pro">
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-mostaza-100 text-ink-900">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-ink-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-700">{description}</p>
            </div>
          </div>

          <div className="rounded-md bg-crema-100 p-4 text-sm leading-6 text-ink-700">
            Pro incluye analytics básico, items ilimitados, sucursales ilimitadas, especiales y
            quitar la marca FudiMenu.
          </div>

          <Link
            href="/settings/billing"
            className="flex min-h-12 w-full items-center justify-center rounded-md bg-[var(--brand-primary)] px-5 text-base font-semibold text-[var(--brand-on-primary)] shadow-md transition-all duration-150 active:scale-[0.97]"
          >
            Upgrade
          </Link>
        </div>
      </Sheet>
    </>
  );
}

export function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink-900 px-2 py-0.5 text-[11px] font-extrabold text-mostaza-500 shadow-sm">
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      Pro
    </span>
  );
}
