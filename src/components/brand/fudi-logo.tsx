import { Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';

type FudiLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
};

export function FudiLogo({ className, markClassName, textClassName }: FudiLogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <span
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-primary)] text-ink-900 shadow-md',
          markClassName,
        )}
        aria-hidden="true"
      >
        <Utensils className="h-6 w-6" strokeWidth={2.5} />
      </span>
      <span className={cn('text-2xl font-black text-ink-900', textClassName)}>FudiMenu</span>
    </div>
  );
}
