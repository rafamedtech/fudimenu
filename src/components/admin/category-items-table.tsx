'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { StockToggle } from '@/components/admin/stock-toggle';
import { TranslationStatusBadge } from '@/components/menu/translation-status-badge';
import { getCategoryEmoji } from '@/lib/category-placeholder';
import { cn, formatPrice } from '@/lib/utils';
import type { Locale, MenuItem } from '@/types/domain';

export function CategoryItemsTable({
  sectionId,
  categoryName,
  items,
  defaultLocale,
}: {
  sectionId: string;
  categoryName: string;
  items: MenuItem[];
  defaultLocale: Locale;
}) {
  return (
    <div className="overflow-hidden rounded-lg bg-[var(--brand-card)] shadow-sm">
      <table className="w-full text-sm">
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-ink-100 first:border-t-0">
              <td className="w-14 py-2 pl-3 pr-1">
                {item.imageUrl ? (
                  <div className="relative size-10 overflow-hidden rounded-md bg-[var(--brand-primary-soft)]">
                    <Image src={item.imageUrl} alt="" fill sizes="40px" className="object-cover" />
                  </div>
                ) : (
                  <div
                    className="flex size-10 items-center justify-center rounded-md bg-[var(--brand-primary-soft)] text-lg"
                    aria-hidden
                  >
                    {getCategoryEmoji(categoryName)}
                  </div>
                )}
              </td>
              <td className="px-2 py-2">
                <Link
                  href={`/menu/${item.id}?sectionId=${sectionId}`}
                  className="flex min-w-0 items-center gap-2"
                >
                  <span
                    className={cn(
                      'truncate font-semibold text-ink-900',
                      !item.isAvailable && 'opacity-50',
                    )}
                  >
                    {item.name}
                  </span>
                  <TranslationStatusBadge item={item} defaultLocale={defaultLocale} />
                </Link>
              </td>
              <td className="px-2 py-2 text-right tabular-nums text-ink-700">
                {formatPrice(item.priceCents, item.currency)}
              </td>
              <td className="px-2 py-2">
                <StockToggle itemId={item.id} initial={item.isAvailable} />
              </td>
              <td className="w-10 py-2 pl-1 pr-3">
                <Link
                  href={`/menu/${item.id}?sectionId=${sectionId}`}
                  aria-label={`Editar ${item.name}`}
                  className="flex size-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                >
                  <ChevronRight className="size-5" aria-hidden />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
