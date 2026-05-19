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
    'fixed bottom-[88px] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[var(--brand-on-primary)] shadow-lg transition-transform active:scale-90 hover:scale-105 ipad:bottom-[104px] ipad:right-[max(1rem,calc((100vw-744px)/2+1rem))] ipad-landscape:right-[max(1rem,calc((100vw-984px)/2+1rem))] desktop:right-[max(1rem,calc((100vw-1180px)/2+1rem))]',
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
