import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:shadow-glow-mostaza',
  {
    variants: {
      variant: {
        primary: 'bg-mostaza-500 text-ink-900 hover:bg-mostaza-400 shadow-md',
        secondary: 'bg-ink-100 text-ink-900 hover:bg-ink-300/40',
        ghost: 'bg-transparent text-ink-700 hover:bg-ink-100',
        outline: 'bg-white text-ink-900 border-[1.5px] border-ink-300 hover:border-ink-500',
        destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-md',
        success: 'bg-menta-500 text-ink-900 hover:opacity-90 shadow-md',
        premium:
          'bg-gradient-to-r from-mostaza-500 to-coral-500 text-ink-900 hover:opacity-95 shadow-md',
      },
      size: {
        sm: 'h-9 px-3 text-sm rounded-sm',
        md: 'h-12 px-5 text-base rounded-md',
        lg: 'h-14 px-6 text-base rounded-md',
        xl: 'h-16 px-7 text-lg rounded-md',
        icon: 'h-12 w-12 rounded-md',
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
