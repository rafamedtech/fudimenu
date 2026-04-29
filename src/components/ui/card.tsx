import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg bg-white p-4 shadow-md', className)}
      {...props}
    />
  );
}
