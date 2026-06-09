import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: Array<SegmentedOption<T>>;
  onValueChange: (value: T) => void;
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onValueChange,
  className,
  buttonClassName,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('inline-flex gap-1 rounded-xl border border-ink-200 bg-ink-50 p-1', className)}
    >
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onValueChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            'h-9 rounded-lg px-4 text-sm font-bold text-ink-600 shadow-none hover:bg-[var(--brand-card)]',
            value === option.value && 'bg-[var(--brand-card)] text-ink-900 shadow-sm ring-1 ring-ink-200',
            buttonClassName,
          )}
        >
          {option.icon ? <span className="inline-flex shrink-0">{option.icon}</span> : null}
          {option.label}
        </Button>
      ))}
    </div>
  );
}
