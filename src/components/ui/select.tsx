import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.ComponentPropsWithRef<'select'> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export function Select({
  className,
  containerClassName,
  labelClassName,
  label,
  error,
  hint,
  id,
  children,
  ref,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? props.name ?? generatedId;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className={cn('text-sm font-medium text-ink-700', labelClassName)}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-11 w-full appearance-none rounded-md border bg-[var(--brand-card)] py-1 pl-3 pr-9 text-sm font-semibold text-ink-800 shadow-sm outline-none transition-all focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary-ring)] disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-red-500' : 'border-ink-100',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
      </div>
      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : hint ? (
        <p className="text-sm text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}
