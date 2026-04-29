import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import type { MenuItem } from '@/types/domain';
import { StockToggle } from '@/components/admin/stock-toggle';
import { ItemCardToggle } from './item-card-toggle';

interface ItemCardProps {
  item: MenuItem;
  href?: string;
  showToggle?: boolean;
}

export function ItemCard({ item, href, showToggle = true }: ItemCardProps) {
  const content = (
    <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm transition-shadow active:shadow-md">
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-crema-100">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">🍽️</div>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] font-bold uppercase tracking-wider text-white">
            Agotado
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <h3 className="truncate font-semibold text-ink-900">{item.name}</h3>
        <p className="font-bold text-ink-900">{formatPrice(item.priceCents, item.currency)}</p>
      </div>
      {showToggle && (
        <ItemCardToggle>
          <StockToggle itemId={item.id} initial={item.isAvailable} />
        </ItemCardToggle>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}
