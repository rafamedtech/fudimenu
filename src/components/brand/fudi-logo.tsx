import Image from 'next/image';
import { cn } from '@/lib/utils';

type FudiLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showText?: boolean;
};

export function FudiLogo({ className, markClassName, textClassName, showText = true }: FudiLogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <Image
        src="/brand/fudimenu-logo.png"
        alt="FudiMenu"
        width={401}
        height={609}
        priority
        className={cn('h-14 w-auto object-contain', markClassName)}
      />
      {showText && (
        <span className={cn('font-heading text-2xl font-black text-ink-900', textClassName)}>
          FudiMenu
        </span>
      )}
    </div>
  );
}
