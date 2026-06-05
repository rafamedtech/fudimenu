import type { ItemVariant, MenuItem } from '@/types/domain';

/**
 * Simple visual variants: customer-facing options of a single dish that differ
 * only by name and price (e.g. "Chico" / "Grande"). They are presentation only
 * — no POS modifiers, required rules, cart or ordering logic depends on them.
 */

/** Max variants per item — keeps the editor and public list bounded. */
export const MAX_VARIANTS_PER_ITEM = 8;

/** Max characters for a variant name. */
export const MAX_VARIANT_NAME_CHARS = 60;

/**
 * Lowest/highest variant price for an item, or null when it has no variants.
 * Pure so the public card ("from $X") and unit tests share one source of truth.
 */
export function getVariantPriceRange(
  variants: Pick<ItemVariant, 'priceCents'>[] | undefined,
): { minCents: number; maxCents: number } | null {
  if (!variants || variants.length === 0) return null;

  let minCents = variants[0].priceCents;
  let maxCents = variants[0].priceCents;
  for (const variant of variants) {
    if (variant.priceCents < minCents) minCents = variant.priceCents;
    if (variant.priceCents > maxCents) maxCents = variant.priceCents;
  }
  return { minCents, maxCents };
}

export function hasVariants(item: Pick<MenuItem, 'variants'>): boolean {
  return (item.variants?.length ?? 0) > 0;
}
