'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [slug, setSlug] = useState(currentSlug);
  const [checkState, setCheckState] = useState<SlugCheckState>(
    currentSlug ? { status: 'available', suggestion: currentSlug } : { status: 'idle' },
  );

  const trimmedSlug = useMemo(() => slug.trim(), [slug]);

  useEffect(() => {
    if (!trimmedSlug) {
      setCheckState({ status: 'idle' });
      return;
    }

    if (trimmedSlug === currentSlug) {
      setCheckState({ status: 'available', suggestion: currentSlug });
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
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

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [currentSlug, trimmedSlug]);

  const hint =
    checkState.status === 'checking'
      ? 'Revisando disponibilidad...'
      : checkState.status === 'available'
        ? '✓ Disponible'
        : checkState.status === 'taken'
          ? `✗ Tomado — prueba: ${checkState.suggestion}`
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
        onChange={(event) => setSlug(event.target.value)}
        maxLength={80}
        autoComplete="off"
        prefix={<Link2 className="h-4 w-4" />}
      />
      <p className={hintClassName} aria-live="polite">
        {hint}
      </p>
    </div>
  );
}
