'use client';

import { useEffect, useRef, useState } from 'react';

export interface NavAnchor {
  id: string;
  label: string;
  variant?: 'default' | 'special';
}

interface Props {
  anchors: NavAnchor[];
  ariaLabel: string;
}

export function PublicMenuStickyNav({ anchors, ariaLabel }: Props) {
  const [active, setActive] = useState<string | null>(anchors[0]?.id ?? null);
  const pillRefs = useRef(new Map<string, HTMLAnchorElement>());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (anchors.length === 0) return;

    const compute = () => {
      const navEl = containerRef.current?.parentElement;
      const navBottom = navEl ? navEl.getBoundingClientRect().bottom : 0;
      const threshold = navBottom + 24;
      let current = anchors[0].id;
      for (const a of anchors) {
        const el = document.getElementById(a.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= threshold) {
          current = a.id;
        } else {
          break;
        }
      }
      setActive(current);
    };

    compute();
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        compute();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [anchors]);

  useEffect(() => {
    if (!active) return;
    const pill = pillRefs.current.get(active);
    if (!pill) return;
    pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [active]);

  if (anchors.length === 0) return null;

  return (
    <nav
      aria-label={ariaLabel}
      className="sticky top-0 z-10 border-b border-[var(--brand-card-border)] bg-[var(--brand-surface-translucent)] backdrop-blur"
    >
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto px-4 py-3 ipad:px-6 ipad-landscape:px-8"
      >
        {anchors.map((a) => {
          const isActive = a.id === active;
          const isSpecial = a.variant === 'special';
          const base =
            'inline-flex min-h-11 items-center whitespace-nowrap rounded-xl border-2 px-4 text-sm font-semibold transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:shadow-glow-mostaza';
          const variant = isActive
            ? isSpecial
              ? 'border-coral-500 bg-coral-50 text-coral-600 shadow-glow-mostaza'
              : 'border-[var(--brand-primary)] bg-[var(--brand-primary-faint)] text-ink-900 shadow-glow-mostaza'
            : isSpecial
              ? 'border-transparent bg-[var(--brand-card)] text-coral-600 shadow-sm hover:border-coral-200 hover:bg-coral-50'
              : 'border-transparent bg-[var(--brand-card)] text-ink-700 shadow-sm hover:border-[var(--brand-card-border)] hover:text-ink-900';
          const className = `${base} ${variant}`;

          return (
            <a
              key={a.id}
              ref={(node) => {
                if (node) pillRefs.current.set(a.id, node);
                else pillRefs.current.delete(a.id);
              }}
              href={`#${a.id}`}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => setActive(a.id)}
              className={className}
            >
              {a.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
