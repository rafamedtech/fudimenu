import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-ring)] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--brand-primary)] text-[var(--brand-on-primary)]',
        secondary: 'border-transparent bg-[var(--brand-primary-soft)] text-[var(--brand-accent-text)]',
        outline: 'border-[var(--brand-card-border)] bg-[var(--brand-card)] text-ink-700',
        destructive: 'border-transparent bg-coral-500 text-white',
        success: 'border-transparent bg-menta-500 text-ink-900',
        dark: 'border-transparent bg-ink-900 text-mostaza-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
