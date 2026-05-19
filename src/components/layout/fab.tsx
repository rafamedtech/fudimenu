'use client';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FabProps {
  href?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
}

export function Fab({ href, onClick, label = 'Agregar', className }: FabProps) {
  const classes = cn(
    'fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))+80px)] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[var(--brand-on-primary)] shadow-[0_8px_24px_rgba(222,18,91,0.35)] transition-all duration-300 ease-spring active:scale-95 hover:scale-110 hover:shadow-[0_12px_28px_rgba(222,18,91,0.45)] ipad:right-[max(1rem,calc((100vw-744px)/2+1rem))] ipad-landscape:right-[max(1rem,calc((100vw-984px)/2+1rem))] desktop:right-[max(1rem,calc((100vw-1180px)/2+1rem))]',
    className,
  );
  if (href) {
    return (
      <Link href={href} aria-label={label} className={classes}>
        <Plus size={28} strokeWidth={2.5} />
      </Link>
    );
  }
  return (
    <button onClick={onClick} aria-label={label} className={classes}>
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
}
