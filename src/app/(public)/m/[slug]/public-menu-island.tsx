'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { getCategoryEmoji } from '@/lib/category-placeholder';
import { formatPrice } from '@/lib/utils';
import { buildWhatsAppOrderUrl } from '@/lib/whatsapp';
import type { MenuItem } from '@/types/domain';

export interface IslandGroup {
  sectionId: string | null;
  sectionName: string | null;
  sectionAccent: string | null;
  categoryId: string;
  categoryName: string;
  items: MenuItem[];
}

export interface IslandStrings {
  searchPlaceholder: string;
  searchAria: string;
  searchClear: string;
  searchEmpty: string;
  closeSheet: string;
  sectionLabel: string;
  special: string;
  soldOut: string;
  orderWhatsApp: string;
  viewDetail: string;
  dailySpecials: string;
  otherCategory: string;
}

interface IslandProps {
  slug: string;
  tenantName: string;
  whatsappPhone: string | null;
  priceLocale: string;
  locale: 'es' | 'en';
  dailySpecials: MenuItem[];
  groups: IslandGroup[];
  strings: IslandStrings;
}

function getItemPrice(item: MenuItem) {
  return item.isSpecialToday ? item.specialPrice ?? item.priceCents : item.priceCents;
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function PublicMenuIsland({
  slug,
  tenantName,
  whatsappPhone,
  priceLocale,
  locale,
  dailySpecials,
  groups,
  strings,
}: IslandProps) {
  const [query, setQuery] = useState('');
  const [openItem, setOpenItem] = useState<MenuItem | null>(null);
  const [openCategory, setOpenCategory] = useState<string>('');
  const deferredQuery = useDeferredValue(query);

  const normalizedQuery = normalize(deferredQuery.trim());

  const matchItem = (item: MenuItem) => {
    if (!normalizedQuery) return true;
    const haystack = `${item.name} ${item.description ?? ''}`;
    return normalize(haystack).includes(normalizedQuery);
  };

  const filteredSpecials = useMemo(
    () => dailySpecials.filter(matchItem),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dailySpecials, normalizedQuery],
  );

  const filteredGroups = useMemo(
    () =>
      groups
        .map((g) => ({ ...g, items: g.items.filter(matchItem) }))
        .filter((g) => g.items.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups, normalizedQuery],
  );

  const hasResults = filteredSpecials.length + filteredGroups.length > 0;

  const buildWhatsapp = (item: MenuItem) =>
    buildWhatsAppOrderUrl({
      phone: whatsappPhone,
      slug,
      itemName: item.name,
      locale,
      restaurantName: tenantName,
      price: formatPrice(getItemPrice(item), item.currency, priceLocale),
    });

  const sections = useMemo(() => {
    const map = new Map<string, { id: string; name: string | null; accent: string | null; groups: IslandGroup[] }>();
    for (const g of filteredGroups) {
      const key = g.sectionId ?? '__nosec__';
      if (!map.has(key)) {
        map.set(key, { id: key, name: g.sectionName, accent: g.sectionAccent, groups: [] });
      }
      map.get(key)!.groups.push(g);
    }
    return Array.from(map.values());
  }, [filteredGroups]);

  return (
    <>
      <div className="px-4 pb-3 pt-4 ipad:px-6 ipad-landscape:px-8">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={strings.searchPlaceholder}
          ariaLabel={strings.searchAria}
          clearLabel={strings.searchClear}
        />
      </div>

      <div
        id="menu-content"
        className="flex flex-col gap-8 px-4 pb-12 ipad:gap-10 ipad:px-6 ipad-landscape:px-8 desktop:px-10"
      >
        {filteredSpecials.length > 0 && (
          <section id="especiales-hoy" aria-labelledby="especiales-heading">
            <h2
              id="especiales-heading"
              className="mb-3 text-xl font-extrabold text-ink-900 ipad:text-2xl"
            >
              {strings.dailySpecials}
            </h2>
            <ItemList
              items={filteredSpecials}
              categoryName={strings.dailySpecials}
              onSelect={(item, catName) => {
                setOpenItem(item);
                setOpenCategory(catName);
              }}
              priceLocale={priceLocale}
              strings={strings}
            />
          </section>
        )}

        {sections.map((sec) => (
          <section key={sec.id} id={sec.id !== '__nosec__' ? `sec-${sec.id}` : undefined}>
            {sec.name && (
              <div
                className="mb-3 flex items-center gap-2 rounded-xl px-4 py-3 ipad:mb-4 ipad:px-5 ipad:py-4"
                style={{ backgroundColor: sec.accent ?? 'var(--brand-card-strong)' }}
              >
                <h2 className="text-2xl font-extrabold text-ink-900 ipad:text-3xl">
                  {sec.name}
                </h2>
              </div>
            )}
            <div className="flex flex-col gap-6">
              {sec.groups.map((g) => (
                <div key={g.categoryId} id={`cat-${g.categoryId}`}>
                  <h3 className="mb-2 px-1 text-base font-bold text-ink-700 ipad:text-lg">
                    {g.categoryName}
                  </h3>
                  <ItemList
                    items={g.items}
                    categoryName={g.categoryName}
                    onSelect={(item, catName) => {
                      setOpenItem(item);
                      setOpenCategory(catName);
                    }}
                    priceLocale={priceLocale}
                    strings={strings}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}

        {!hasResults && (
          <p className="py-12 text-center text-base text-ink-500">{strings.searchEmpty}</p>
        )}
      </div>

      <ItemSheet
        item={openItem}
        categoryName={openCategory}
        onClose={() => setOpenItem(null)}
        priceLocale={priceLocale}
        whatsappUrl={openItem ? buildWhatsapp(openItem) : null}
        strings={strings}
      />
    </>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  clearLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel: string;
  clearLabel: string;
}) {
  return (
    <label
      className="flex h-12 items-center gap-2 rounded-md border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 shadow-sm transition-all focus-within:border-[var(--brand-primary)] focus-within:shadow-glow-mostaza"
    >
      <span className="sr-only">{ariaLabel}</span>
      <svg
        aria-hidden
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-ink-500"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="20" y1="20" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-full w-full appearance-none bg-transparent text-base font-medium text-ink-900 outline-none placeholder:text-ink-500 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => onChange('')}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-[var(--brand-primary-faint)] hover:text-ink-900"
        >
          <svg
            aria-hidden
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </label>
  );
}

function ItemList({
  items,
  categoryName,
  onSelect,
  priceLocale,
  strings,
}: {
  items: MenuItem[];
  categoryName: string;
  onSelect: (item: MenuItem, catName: string) => void;
  priceLocale: string;
  strings: IslandStrings;
}) {
  return (
    <ul className="grid gap-3 ipad:gap-4 ipad-landscape:grid-cols-2">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect(item, categoryName)}
            data-item-id={item.id}
            data-item-category={categoryName}
            className="flex w-full items-start gap-3 rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-3 text-left shadow-sm transition-all hover:border-[var(--brand-primary-border)] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:shadow-glow-mostaza ipad:gap-4 ipad:p-4"
            aria-label={`${item.name} — ${strings.viewDetail}`}
          >
            <ItemThumb item={item} categoryName={categoryName} soldOutLabel={strings.soldOut} />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-ink-900 ipad:text-lg">{item.name}</h4>
                {item.isSpecialToday && (
                  <span className="shrink-0 rounded-md bg-coral-500 px-2 py-1 text-[10px] font-extrabold uppercase text-white">
                    {strings.special}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="mt-1 line-clamp-2 text-sm text-ink-500 ipad:text-base">
                  {item.description}
                </p>
              )}
              <p
                className={`mt-2 font-extrabold tabular-nums text-ink-900 ipad:text-lg ${
                  !item.isAvailable ? 'line-through opacity-50' : ''
                }`}
              >
                {formatPrice(getItemPrice(item), item.currency, priceLocale)}
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function ItemThumb({
  item,
  categoryName,
  soldOutLabel,
}: {
  item: MenuItem;
  categoryName: string;
  soldOutLabel: string;
}) {
  return (
    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-[var(--brand-primary-soft)] ipad:h-24 ipad:w-24 ipad-landscape:h-28 ipad-landscape:w-28">
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 112px, (min-width: 768px) 96px, 80px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-4xl">
          {getCategoryEmoji(categoryName)}
        </div>
      )}
      {!item.isAvailable && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-bold uppercase text-white">
          {soldOutLabel}
        </div>
      )}
    </div>
  );
}

function ItemSheet({
  item,
  categoryName,
  onClose,
  priceLocale,
  whatsappUrl,
  strings,
}: {
  item: MenuItem | null;
  categoryName: string;
  onClose: () => void;
  priceLocale: string;
  whatsappUrl: string | null;
  strings: IslandStrings;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (item && !dialog.open) {
      dialog.showModal();
    } else if (!item && dialog.open) {
      dialog.close();
    }
  }, [item]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-labelledby={item ? `sheet-title-${item.id}` : undefined}
      className="fixed inset-x-0 bottom-0 top-auto mx-auto w-full max-w-md rounded-t-xl bg-[var(--brand-card)] p-0 text-ink-900 shadow-xl backdrop:bg-black/50 backdrop:backdrop-blur-sm open:animate-sheet-in ipad:max-w-[640px]"
    >
      {item && (
        <div className="flex max-h-[95dvh] flex-col overflow-hidden">
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-ink-300" aria-hidden />

          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-[var(--brand-primary-soft)]">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="(min-width: 768px) 640px, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl">
                {getCategoryEmoji(categoryName)}
              </div>
            )}
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label={strings.closeSheet}
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-card)]/90 text-ink-900 shadow-md transition-colors hover:bg-[var(--brand-card)] focus-visible:outline-none focus-visible:shadow-glow-mostaza"
            >
              <svg
                aria-hidden
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {item.isSpecialToday && (
              <span className="absolute left-3 top-3 inline-flex items-center rounded-md bg-coral-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
                {strings.special}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 pb-6 pt-5 pb-safe ipad:px-8 ipad:pt-6">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
              {categoryName}
            </p>
            <h2
              id={`sheet-title-${item.id}`}
              className="text-2xl font-extrabold text-ink-900 ipad:text-3xl"
            >
              {item.name}
            </h2>
            {item.description && (
              <p className="text-base leading-relaxed text-ink-700">{item.description}</p>
            )}
            <div className="flex items-baseline gap-3 pt-1">
              {item.isSpecialToday && item.specialPrice !== null && (
                <span className="text-base text-ink-500 line-through tabular-nums">
                  {formatPrice(item.priceCents, item.currency, priceLocale)}
                </span>
              )}
              <span className="text-3xl font-extrabold text-ink-900 tabular-nums ipad:text-4xl">
                {formatPrice(getItemPrice(item), item.currency, priceLocale)}
              </span>
            </div>
            {whatsappUrl && item.isAvailable ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-track-wa={item.id}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[var(--brand-primary)] px-6 text-base font-bold text-[var(--brand-on-primary)] shadow-[0_6px_14px_rgba(244,180,0,0.24)] transition-all hover:bg-[var(--brand-primary-hover)] active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-glow-mostaza"
              >
                {strings.orderWhatsApp}
              </a>
            ) : (
              !item.isAvailable && (
                <p className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md border border-[var(--brand-card-border)] px-6 text-sm font-bold uppercase tracking-wider text-ink-500">
                  {strings.soldOut}
                </p>
              )
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
