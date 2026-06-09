import { useId } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.ComponentPropsWithRef<'textarea'> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export function Textarea({
  className,
  containerClassName,
  labelClassName,
  label,
  error,
  hint,
  id,
  ref,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? props.name ?? generatedId;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={textareaId} className={cn('text-sm font-medium text-ink-700', labelClassName)}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={cn(
          'min-h-28 w-full rounded-md border-[1.5px] bg-[var(--brand-card)] p-4 text-base text-ink-900 outline-none transition-all placeholder:text-ink-500 focus:border-[var(--brand-primary)] focus:shadow-glow-mostaza disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-red-500' : 'border-ink-300',
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : hint ? (
        <p className="text-sm text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}
