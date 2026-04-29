'use client';
import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function Toggle({ checked, onChange, disabled, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-8 w-[52px] flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        checked ? 'bg-menta-500' : 'bg-ink-300',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-7 w-7 translate-y-0.5 rounded-full bg-white shadow-md transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
