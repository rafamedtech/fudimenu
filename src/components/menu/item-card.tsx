import Image from 'next/image';
import Link from 'next/link';
import { getCategoryEmoji } from '@/lib/category-placeholder';
import { formatPrice } from '@/lib/utils';
import type { MenuItem } from '@/types/domain';
import { ItemCardQuickActions } from './item-card-quick-actions';

interface ItemCardProps {
  item: MenuItem;
  categoryName?: string | null;
  href?: string;
  showToggle?: boolean;
}

export function ItemCard({ item, categoryName, href, showToggle = true }: ItemCardProps) {
  const placeholderEmoji = getCategoryEmoji(categoryName);
  const content = (
    <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm transition-shadow active:shadow-md">
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-crema-100">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            {placeholderEmoji}
          </div>
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
    </div>
  );

  const card = href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );

  return showToggle ? (
    <ItemCardQuickActions itemId={item.id} initialAvailable={item.isAvailable}>
      {card}
    </ItemCardQuickActions>
  ) : (
    card
  );
}
