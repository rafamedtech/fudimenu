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
    <div className="flex items-center gap-4 rounded-[24px] bg-[var(--brand-card)] p-4 shadow-[0_4px_20px_rgba(222,18,91,0.04)] border border-[var(--brand-card-border)] transition-all duration-300 ease-spring hover:shadow-[0_8px_28px_rgba(222,18,91,0.08)] hover:-translate-y-0.5 active:scale-[0.98] ipad:gap-5 ipad:p-5 ipad-landscape:flex-col ipad-landscape:items-stretch ipad-landscape:gap-3 ipad-landscape:p-0 ipad-landscape:overflow-hidden">
      <div className="relative size-20 flex-shrink-0 overflow-hidden rounded-2xl bg-[var(--brand-surface-strong)] shadow-inner ipad-landscape:h-44 ipad-landscape:w-full ipad-landscape:rounded-none ipad-landscape:rounded-t-[24px]">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill sizes="(min-width: 1024px) 280px, (min-width: 768px) 80px, 64px" className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-3xl select-none bg-gradient-to-br from-[var(--brand-primary-muted)] to-[var(--brand-primary-soft)] ipad-landscape:text-5xl">
            {placeholderEmoji}
          </div>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur-[1px]">
            Agotado
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center min-w-0 ipad-landscape:px-4 ipad-landscape:pb-4 ipad-landscape:pt-1">
        <h3 className="truncate font-bold text-ink-900 text-base leading-snug ipad:text-lg">{item.name}</h3>
        <p className="font-extrabold text-[var(--brand-primary)] text-base mt-1 tracking-tight">{formatPrice(item.priceCents, item.currency)}</p>
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
