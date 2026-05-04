import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, prefix, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? props.name ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
            {label}
          </label>
        )}
        <div
          className={cn(
            'flex h-14 items-center gap-2 rounded-md border-[1.5px] bg-white px-4 transition-all',
            'focus-within:border-mostaza-500 focus-within:shadow-glow-mostaza',
            error ? 'border-red-500' : 'border-ink-300',
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
