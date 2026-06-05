import { describe, expect, it } from 'vitest';
import { getVariantPriceRange, hasVariants, MAX_VARIANTS_PER_ITEM } from '@/lib/item-variants';
import { itemSchema } from '@/lib/validators/item.schema';

describe('getVariantPriceRange', () => {
  // The public card advertises "from $min", so min must be the cheapest
  // option regardless of input order — that's the customer-facing promise.
  it('returns the min/max across variants in any order', () => {
    const range = getVariantPriceRange([
      { priceCents: 9500 },
      { priceCents: 8500 },
      { priceCents: 12000 },
    ]);
    expect(range).toEqual({ minCents: 8500, maxCents: 12000 });
  });

  it('returns null when there are no variants', () => {
    expect(getVariantPriceRange([])).toBeNull();
    expect(getVariantPriceRange(undefined)).toBeNull();
  });

  it('handles a single variant', () => {
    expect(getVariantPriceRange([{ priceCents: 5000 }])).toEqual({
      minCents: 5000,
      maxCents: 5000,
    });
  });
});

describe('hasVariants', () => {
  it('is true only when at least one variant exists', () => {
    expect(hasVariants({ variants: [{ id: 'v', name: 'Grande', priceCents: 100, sortOrder: 0 }] })).toBe(
      true,
    );
    expect(hasVariants({ variants: [] })).toBe(false);
    expect(hasVariants({ variants: undefined })).toBe(false);
  });
});

describe('itemSchema variants', () => {
  const base = { categoryId: 'c1', name: 'Jugo', priceCents: 8500 };

  // A stray empty editor row must not block the whole save — incomplete rows
  // (missing name or price) are dropped rather than rejected.
  it('drops rows with a blank name or zero price', () => {
    const parsed = itemSchema.parse({
      ...base,
      variants: [
        { name: 'Chico', priceCents: 8500 },
        { name: '', priceCents: 9500 },
        { name: 'Sin precio', priceCents: 0 },
      ],
    });
    expect(parsed.variants).toEqual([{ name: 'Chico', priceCents: 8500 }]);
  });

  it('keeps complete rows and preserves their order', () => {
    const parsed = itemSchema.parse({
      ...base,
      variants: [
        { name: 'Chico', priceCents: 8500 },
        { name: 'Grande', priceCents: 9500 },
      ],
    });
    expect(parsed.variants).toEqual([
      { name: 'Chico', priceCents: 8500 },
      { name: 'Grande', priceCents: 9500 },
    ]);
  });

  it('rejects more than the max number of variants', () => {
    const tooMany = Array.from({ length: MAX_VARIANTS_PER_ITEM + 1 }, (_, i) => ({
      name: `Opción ${i}`,
      priceCents: 1000 + i,
    }));
    expect(() => itemSchema.parse({ ...base, variants: tooMany })).toThrow();
  });
});
