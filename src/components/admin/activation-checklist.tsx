'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, Circle } from 'lucide-react';
import Link from 'next/link';
import type { ActivationChecklist } from '@/lib/activation-checklist';

export function ActivationChecklistPanel({ checklist }: { checklist: ActivationChecklist }) {
  const isComplete = checklist.completedCount === checklist.totalCount;
  const [open, setOpen] = useState(!isComplete);

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] shadow-md">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--brand-surface)] ipad:px-5 ipad:py-4"
        aria-expanded={open}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="shrink-0 text-[11px] font-black uppercase tracking-wider text-ink-500">
            Activación
          </span>
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--brand-surface-strong)]"
            role="progressbar"
            aria-valuenow={checklist.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progreso de activación"
          >
            <div
              className="h-full rounded-full bg-menta-500 transition-all duration-500"
              style={{ width: `${checklist.percent}%` }}
            />
          </div>
          <span className="shrink-0 text-sm font-bold tabular-nums text-ink-700">
            {checklist.completedCount}/{checklist.totalCount}
          </span>
          {isComplete && (
            <CheckCircle2 className="size-4 shrink-0 text-menta-500" aria-hidden />
          )}
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-ink-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul className="border-t border-[var(--brand-card-border)] divide-y divide-[var(--brand-card-border)]">
          {checklist.items.map((item) => {
            const Icon = item.completed ? CheckCircle2 : Circle;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--brand-primary-faint)] ipad:px-5"
                >
                  <Icon
                    className={`size-4 shrink-0 ${item.completed ? 'text-menta-500' : 'text-ink-300'}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="text-sm font-semibold text-ink-900">{item.title}</span>
                    {!item.completed && (
                      <span className="ml-2 text-xs text-ink-400">{item.description}</span>
                    )}
                  </span>
                  {item.metric && (
                    <span className="shrink-0 text-xs font-medium text-ink-400">{item.metric}</span>
                  )}
                  {!item.completed && (
                    <span className="shrink-0 text-xs font-semibold text-[var(--brand-accent-text)] opacity-0 transition-opacity group-hover:opacity-100">
                      Ir →
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
