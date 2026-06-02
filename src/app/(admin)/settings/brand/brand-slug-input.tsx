'use client';

import { useEffect, useMemo, useReducer, useState } from 'react';
import { Link2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

type SlugCheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available'; suggestion: string }
  | { status: 'taken'; suggestion: string }
  | { status: 'error' };

type BrandSlugInputProps = {
  currentSlug: string;
};

export function BrandSlugInput({ currentSlug }: BrandSlugInputProps) {
  const [slug, setSlug] = useReducer((_: string, next: string) => next, currentSlug);
  const [checkState, setCheckState] = useState<SlugCheckState>(
    currentSlug ? { status: 'available', suggestion: currentSlug } : { status: 'idle' },
  );
  const pending = useMemo<{ timer: number | null; controller: AbortController | null }>(
    () => ({ timer: null, controller: null }),
    [],
  );

  useEffect(() => {
    return () => {
      pending.controller?.abort();
      if (pending.timer !== null) window.clearTimeout(pending.timer);
    };
  }, [pending]);

  function updateSlug(nextSlug: string) {
    setSlug(nextSlug);
    pending.controller?.abort();
    if (pending.timer !== null) window.clearTimeout(pending.timer);

    const trimmedSlug = nextSlug.trim();
    if (!trimmedSlug) {
      setCheckState({ status: 'idle' });
      return;
    }

    if (trimmedSlug === currentSlug) {
      setCheckState({ status: 'available', suggestion: currentSlug });
      return;
    }

    const controller = new AbortController();
    pending.controller = controller;
    pending.timer = window.setTimeout(async () => {
      setCheckState({ status: 'checking' });

      try {
        const response = await fetch(`/api/slug-check?slug=${encodeURIComponent(trimmedSlug)}`, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error('slug_check_failed');

        const data = (await response.json()) as {
          available: boolean;
          suggestion: string;
        };

        setCheckState({
          status: data.available ? 'available' : 'taken',
          suggestion: data.suggestion,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setCheckState({ status: 'error' });
      }
    }, 400);
  }

  const hint =
    checkState.status === 'checking'
      ? 'Revisando disponibilidad...'
      : checkState.status === 'available'
        ? '✓ Disponible'
        : checkState.status === 'taken'
          ? `✗ Tomado. Prueba: ${checkState.suggestion}`
          : checkState.status === 'error'
            ? 'No se pudo revisar el slug ahora.'
            : 'URL publica del menu.';

  const hintClassName =
    checkState.status === 'available'
      ? 'text-sm font-semibold text-menta-700'
      : checkState.status === 'taken'
        ? 'text-sm font-semibold text-red-600'
        : 'text-sm text-ink-500';

  return (
    <div className="flex flex-col gap-1.5">
      <Input
        name="slug"
        label="Slug publico"
        value={slug}
        onChange={(event) => updateSlug(event.target.value)}
        maxLength={48}
        autoComplete="off"
        prefix={<Link2 className="size-4" />}
      />
      <p className={hintClassName} aria-live="polite">
        {hint}
      </p>
    </div>
  );
}
