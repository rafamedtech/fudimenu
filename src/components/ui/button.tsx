import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md font-semibold transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:shadow-glow-mostaza',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--brand-primary)] text-[var(--brand-on-primary)] hover:bg-[var(--brand-primary-hover)] shadow-[0_6px_14px_rgba(244,180,0,0.24)] hover:shadow-[0_8px_20px_rgba(244,180,0,0.32)]',
        secondary: 'bg-[var(--brand-primary-soft)] text-[var(--brand-accent-text)] hover:bg-[var(--brand-primary-muted)]',
        ghost: 'bg-transparent text-ink-700 hover:bg-[var(--brand-primary-faint)]',
        outline:
          'bg-[var(--brand-card)] text-ink-900 border-[1.5px] border-[var(--brand-primary-border)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-faint)]',
        destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-md',
        success: 'bg-menta-500 text-ink-900 hover:opacity-90 shadow-md',
        premium:
          'bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-primary-hover))] text-[var(--brand-on-primary)] hover:opacity-95 shadow-[0_6px_14px_rgba(244,180,0,0.28)]',
      },
      size: {
        sm: 'h-10 px-4 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-base',
        icon: 'h-11 w-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Spinner /> : children}
      </button>
    );
  },
);
Button.displayName = 'Button';

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}
