import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SectionHeadingProps = {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  icon?: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  id?: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function SectionHeading({
  title,
  description,
  meta,
  icon,
  as: Heading = 'h2',
  id,
  className,
  titleClassName,
  descriptionClassName,
}: SectionHeadingProps) {
  return (
    <header className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon}
        <div className="min-w-0">
          <Heading
            id={id}
            className={cn(
              'font-heading text-xl font-extrabold leading-tight text-ink-900 ipad:text-2xl',
              titleClassName,
            )}
          >
            {title}
          </Heading>
          {description ? (
            <p
              className={cn(
                'mt-1 max-w-prose text-sm leading-6 text-ink-500',
                descriptionClassName,
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
    </header>
  );
}
