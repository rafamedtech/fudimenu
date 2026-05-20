import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  controlClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      labelClassName,
      controlClassName,
      label,
      error,
      hint,
      prefix,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? props.name ?? generatedId;
    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className={cn('text-sm font-medium text-ink-700', labelClassName)}>
            {label}
          </label>
        )}
        <div
          className={cn(
            'flex h-14 items-center gap-2 rounded-md border bg-[var(--brand-card)] px-4 transition-all',
            'focus-within:border-[var(--brand-primary)] focus-within:shadow-glow-mostaza',
            error ? 'border-red-500' : 'border-ink-200',
            controlClassName,
          )}
        >
          {prefix && <span className="text-ink-500">{prefix}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-full w-full bg-transparent text-base font-medium text-ink-900 outline-none placeholder:text-ink-500',
              className,
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : hint ? (
          <p className="text-sm text-ink-500">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';
