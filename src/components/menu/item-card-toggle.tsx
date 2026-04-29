'use client';
import type { ReactNode } from 'react';

interface ItemCardToggleProps {
  children: ReactNode;
}

export function ItemCardToggle({ children }: ItemCardToggleProps) {
  return <div onClick={(event) => event.preventDefault()}>{children}</div>;
}
