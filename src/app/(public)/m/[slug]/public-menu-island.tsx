'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { track } from '@/lib/analytics/events';
import { getCategoryEmoji } from '@/lib/category-placeholder';
import { withItemImageCrop, type ItemImageCrop } from '@/lib/cloudinary';
import { formatPrice } from '@/lib/utils';
import { buildWhatsAppOrderUrl } from '@/lib/whatsapp';
import {
  getItemBadges,
  getItemBadgesAccessibleLabel,
  type BadgeLabels,
  type ItemBadge,
} from '@/lib/item-attributes';
import type { MenuItem } from '@/types/domain';
import type { PublicMenuGroup as IslandGroup } from '@/lib/public-menu-groups';

export type { PublicMenuGroup as IslandGroup } from '@/lib/public-menu-groups';

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
  badges: BadgeLabels;
  allergenDisclaimer: string;
  containsAllergens: string;
}

interface IslandProps {
  slug: string;
  tenantId: string;
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
  tenantId,
  tenantName,
  whatsappPhone,
  priceLocale,
  locale,
  dailySpecials,
  groups,
  strings,
}: IslandProps) {
  const [query, setQuery] = useState('');
  const [sheetSelection, setSheetSelection] = useState<{
    item: MenuItem;
    categoryName: string;
    whatsappUrl: string | null;
  } | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const normalizedQuery = normalize(deferredQuery.trim());

  const matchItem = (item: MenuItem) => {
    if (!normalizedQuery) return true;
    const haystack = `${item.name} ${item.description ?? ''}`;
    return normalize(haystack).includes(normalizedQuery);
  };

  const filteredSpecials = dailySpecials.filter(matchItem);
  const filteredGroups: IslandGroup[] = [];
  for (const group of groups) {
    const matchingItems = group.items.filter(matchItem);
    if (matchingItems.length > 0) filteredGroups.push({ ...group, items: matchingItems });
  }

  const hasResults = filteredSpecials.length + filteredGroups.length > 0;

  // Total matched items (not groups) — basis for the menu_search resultCount,
  // so no-results searches surface menu gaps in the Pro dashboard.
  const resultItemCount =
    filteredSpecials.length + filteredGroups.reduce((sum, g) => sum + g.items.length, 0);
  const resultItemCountRef = useRef(resultItemCount);
  resultItemCountRef.current = resultItemCount;
  const lastTrackedQueryRef = useRef('');

  // Debounce per settled query: fire once a query stabilizes (min 2 chars),
  // deduped per session, with the result count at fire time.
  useEffect(() => {
    if (normalizedQuery.length < 2) return;
    const handle = setTimeout(() => {
      if (lastTrackedQueryRef.current === normalizedQuery) return;
      lastTrackedQueryRef.current = normalizedQuery;
      track('menu_search', {
        tenantId,
        query: normalizedQuery,
        resultCount: resultItemCountRef.current,
      });
    }, 700);
    return () => clearTimeout(handle);
  }, [normalizedQuery, tenantId]);

  const buildWhatsapp = (item: MenuItem) =>
    buildWhatsAppOrderUrl({
      phone: whatsappPhone,
      slug,
      itemName: item.name,
      locale,
      restaurantName: tenantName,
      price: formatPrice(getItemPrice(item), item.currency, priceLocale),
    });

  const openItemSheet = (item: MenuItem, categoryName: string) => {
    track('item_detail_viewed', { itemId: item.id, category: categoryName });
    setSheetSelection({ item, categoryName, whatsappUrl: buildWhatsapp(item) });
    setIsSheetOpen(true);
    // Make the open item shareable: reflect it in the URL hash without a history
    // push so back returns to the menu, not to a re-open loop.
    if (typeof history !== 'undefined') {
      history.replaceState(null, '', `#item-${item.id}`);
    }
  };

  const clearItemHash = () => {
    if (typeof history !== 'undefined' && location.hash.startsWith('#item-')) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  };

  // Flat lookup of every rendered item → its display category, so a shared
  // `#item-<id>` link can open the right detail sheet on load. Built from the
  // unfiltered props (search hasn't run yet on mount).
  const itemIndex = useMemo(() => {
    const index = new Map<string, { item: MenuItem; categoryName: string }>();
    for (const item of dailySpecials) {
      index.set(item.id, { item, categoryName: strings.dailySpecials });
    }
    for (const group of groups) {
      for (const item of group.items) {
        if (!index.has(item.id)) index.set(item.id, { item, categoryName: group.categoryName });
      }
    }
    return index;
  }, [dailySpecials, groups, strings.dailySpecials]);

  // Open the detail sheet for a deep-linked item on first load. Runs once: the
  // anchor (`id="item-<id>"`) handles scroll/focus; this restores the overlay.
  const didDeepLink = useRef(false);
  useEffect(() => {
    if (didDeepLink.current) return;
    didDeepLink.current = true;
    const hash = location.hash;
    if (!hash.startsWith('#item-')) return;
    const match = itemIndex.get(hash.slice('#item-'.length));
    if (match) openItemSheet(match.item, match.categoryName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIndex]);

  const sectionsById = new Map<
    string,
    {
      id: string;
      name: string | null;
      accent: string | null;
      coverImageUrl: string | null;
      groups: IslandGroup[];
    }
  >();
  for (const group of filteredGroups) {
    const key = group.sectionId ?? '__nosec__';
    if (!sectionsById.has(key)) {
      sectionsById.set(key, {
        id: key,
        name: group.sectionName,
        accent: group.sectionAccent,
        coverImageUrl: group.sectionCoverImageUrl,
        groups: [],
      });
    }
    sectionsById.get(key)!.groups.push(group);
  }
  const sections = Array.from(sectionsById.values());

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
              onSelect={openItemSheet}
              priceLocale={priceLocale}
              strings={strings}
            />
          </section>
        )}

        {sections.map((sec) => (
          <section key={sec.id} id={sec.id !== '__nosec__' ? `sec-${sec.id}` : undefined}>
            {sec.name && (
              <div
                className="relative mb-3 flex min-h-24 items-end overflow-hidden rounded-xl px-4 py-3 ipad:mb-4 ipad:min-h-32 ipad:px-5 ipad:py-4"
                style={{ backgroundColor: sec.accent ?? 'var(--brand-card-strong)' }}
              >
                {sec.coverImageUrl && (
                  <>
                    <Image
                      src={sec.coverImageUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 1100px, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900/75 via-ink-900/25 to-transparent" />
                  </>
                )}
                <h2
                  className={`relative z-[1] text-2xl font-extrabold ipad:text-3xl ${
                    sec.coverImageUrl ? 'text-white' : 'text-ink-900'
                  }`}
                >
                  {sec.name}
                </h2>
              </div>
            )}
            <div className="flex flex-col gap-6">
              {sec.groups.map((g) => (
                <div key={g.categoryId} id={`cat-${g.categoryId}`}>
                  <div className="mb-2 flex items-center gap-3 px-1">
                    {g.categoryCoverImageUrl && (
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-[var(--brand-primary-soft)] ipad:size-14">
                        <Image
                          src={g.categoryCoverImageUrl}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <h3 className="text-base font-bold text-ink-700 ipad:text-lg">
                      {g.categoryName}
                    </h3>
                  </div>
                  <ItemList
                    items={g.items}
                    categoryName={g.categoryName}
                    onSelect={openItemSheet}
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

      {sheetSelection && (
        <ItemSheet
          key={sheetSelection.item.id}
          item={sheetSelection.item}
          categoryName={sheetSelection.categoryName}
          open={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          onClosed={() => {
            setSheetSelection(null);
            clearItemHash();
          }}
          priceLocale={priceLocale}
          whatsappUrl={sheetSelection.whatsappUrl}
          strings={strings}
        />
      )}
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
        className="size-full appearance-none bg-transparent text-base font-medium text-ink-900 outline-none placeholder:text-ink-500 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => onChange('')}
          className="inline-flex size-8 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-[var(--brand-primary-faint)] hover:text-ink-900"
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

export function ItemList({
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
      {items.map((item) => {
        const badges = getItemBadges(item, strings.badges);
        const badgeLabel = getItemBadgesAccessibleLabel(badges, {
          contains: strings.containsAllergens,
        });
        return (
        <li key={item.id} id={`item-${item.id}`} className="scroll-mt-20">
          <button
            type="button"
            onClick={() => onSelect(item, categoryName)}
            data-item-id={item.id}
            data-item-category={categoryName}
            className="flex w-full items-start gap-3 rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-3 text-left shadow-sm transition-all hover:border-[var(--brand-primary-border)] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:shadow-glow-mostaza ipad:gap-4 ipad:p-4"
            aria-label={`${item.name}${badgeLabel ? `. ${badgeLabel}` : ''} — ${strings.viewDetail}`}
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
              {/* Visual only: the badge meaning is carried by the button's
                  aria-label, so hide the chips from the a11y tree to avoid a
                  duplicate/confusing announcement. */}
              <BadgeRow badges={badges} size="sm" ariaHidden />
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
        );
      })}
    </ul>
  );
}

function BadgeRow({
  badges,
  size,
  ariaHidden = false,
}: {
  badges: ItemBadge[];
  size: 'sm' | 'md';
  ariaHidden?: boolean;
}) {
  if (badges.length === 0) return null;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <ul
      aria-hidden={ariaHidden || undefined}
      className={`mt-2 flex flex-wrap gap-1.5 ${size === 'sm' ? '' : 'gap-2'}`}
    >
      {badges.map((badge) => (
        <li
          key={`${badge.kind}-${badge.key}`}
          className={`inline-flex items-center rounded-full font-bold uppercase tracking-wide ${sizeClass} ${
            badge.kind === 'dietary'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-900'
          }`}
        >
          {badge.label}
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
    <div className="relative size-20 flex-shrink-0 overflow-hidden rounded-md bg-[var(--brand-primary-soft)] ipad:h-24 ipad:w-24 ipad-landscape:h-28 ipad-landscape:w-28">
      {item.imageUrl ? (
        <Image
          src={withItemImageCrop(item.imageUrl, item.imageCrop as ItemImageCrop | null, {
            aspect: '1:1',
            width: 224,
          })}
          alt=""
          fill
          sizes="(min-width: 1024px) 112px, (min-width: 768px) 96px, 80px"
          className="object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-4xl">
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

export function ItemSheet({
  item,
  categoryName,
  open,
  onClose,
  onClosed,
  priceLocale,
  whatsappUrl,
  strings,
}: {
  item: MenuItem;
  categoryName: string;
  open: boolean;
  onClose: () => void;
  onClosed: () => void;
  priceLocale: string;
  whatsappUrl: string | null;
  strings: IslandStrings;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onClosedRef = useRef(onClosed);

  useEffect(() => {
    onClosedRef.current = onClosed;
  }, [onClosed]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) {
        dialog.showModal();
        dialog.getAnimations().forEach((a) => a.cancel());
        dialog.animate(
          [
            { opacity: 0, transform: 'translateY(40px) scale(0.98)' },
            { opacity: 1, transform: 'translateY(0) scale(1)' },
          ],
          { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' },
        );
      }
      return;
    }
    if (!dialog.open) return;
    const cs = getComputedStyle(dialog);
    const fromOpacity = cs.opacity;
    const fromTransform = cs.transform === 'none' ? 'translateY(0) scale(1)' : cs.transform;
    dialog.getAnimations().forEach((a) => a.cancel());
    const anim = dialog.animate(
      [
        { opacity: fromOpacity, transform: fromTransform },
        { opacity: 0, transform: 'translateY(32px) scale(0.98)' },
      ],
      { duration: 220, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
    );
    const onFinish = () => {
      anim.cancel();
      dialog.close();
      onClosedRef.current();
    };
    anim.addEventListener('finish', onFinish);
    return () => {
      anim.removeEventListener('finish', onFinish);
      anim.cancel();
    };
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  const handleBackdropPointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current && open) {
      onClose();
    }
  };

  const stateClasses = open
    ? 'open:[&::backdrop]:animate-backdrop-in'
    : '[&::backdrop]:animate-backdrop-out';

  return (
    <dialog
      ref={dialogRef}
      onPointerDown={handleBackdropPointerDown}
      aria-labelledby={`sheet-title-${item.id}`}
      className={`fixed inset-x-0 bottom-0 top-auto mx-auto w-full max-w-md rounded-t-3xl bg-[var(--brand-card)] p-0 text-ink-900 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm ipad:max-w-[640px] ${stateClasses}`}
    >
      <div className="flex max-h-[92dvh] flex-col overflow-hidden">
          <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2.5">
            <span className="h-1.5 w-12 rounded-full bg-white/70 shadow-sm" aria-hidden />
          </div>

          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-[var(--brand-primary-soft)]">
            {item.imageUrl ? (
              <Image
                src={withItemImageCrop(item.imageUrl, item.imageCrop as ItemImageCrop | null, {
                  aspect: '4:3',
                  width: 800,
                })}
                alt={item.imageAltText?.trim() ? item.imageAltText : item.name}
                fill
                sizes="(min-width: 768px) 640px, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-7xl">
                {getCategoryEmoji(categoryName)}
              </div>
            )}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label={strings.closeSheet}
              className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full bg-[var(--brand-card)]/95 text-ink-900 shadow-md backdrop-blur-sm transition-all hover:scale-105 hover:bg-[var(--brand-card)] active:scale-95 focus-visible:outline-none focus-visible:shadow-glow-mostaza"
            >
              <svg
                aria-hidden
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              {item.isSpecialToday && (
                <span className="inline-flex items-center rounded-full bg-coral-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md">
                  {strings.special}
                </span>
              )}
              {!item.isAvailable && (
                <span className="inline-flex items-center rounded-full bg-ink-900/85 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md backdrop-blur-sm">
                  {strings.soldOut}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-4 pt-5 ipad:px-8 ipad:pt-6">
            <span className="inline-flex w-fit items-center rounded-full bg-[var(--brand-primary-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
              {categoryName}
            </span>
            <h2
              id={`sheet-title-${item.id}`}
              className="text-2xl font-extrabold leading-tight tracking-tight text-ink-900 ipad:text-3xl"
            >
              {item.name}
            </h2>
            {item.description && (
              <p className="text-base leading-relaxed text-ink-700">{item.description}</p>
            )}
            {(() => {
              const badges = getItemBadges(item, strings.badges);
              if (badges.length === 0) return null;
              return (
                <div className="space-y-2">
                  <BadgeRow badges={badges} size="md" />
                  <p className="text-xs leading-relaxed text-ink-500">
                    {strings.allergenDisclaimer}
                  </p>
                </div>
              );
            })()}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl font-extrabold text-ink-900 tabular-nums ipad:text-4xl">
                {formatPrice(getItemPrice(item), item.currency, priceLocale)}
              </span>
              {item.isSpecialToday && item.specialPrice !== null && (
                <span className="text-base text-ink-500 line-through tabular-nums">
                  {formatPrice(item.priceCents, item.currency, priceLocale)}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 pb-safe pt-4 ipad:px-8">
            {whatsappUrl && item.isAvailable ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-track-wa={item.id}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 text-base font-bold text-[var(--brand-on-primary)] shadow-[0_6px_14px_rgba(244,180,0,0.28)] transition-all hover:bg-[var(--brand-primary-hover)] active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-glow-mostaza"
              >
                {strings.orderWhatsApp}
              </a>
            ) : (
              !item.isAvailable && (
                <p className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[var(--brand-card-border)] px-6 text-sm font-bold uppercase tracking-wider text-ink-500">
                  {strings.soldOut}
                </p>
              )
            )}
          </div>
      </div>
    </dialog>
  );
}
