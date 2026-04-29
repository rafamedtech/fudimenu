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
    'fixed bottom-[88px] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-mostaza-500 text-ink-900 shadow-lg transition-transform active:scale-90 hover:scale-105',
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
