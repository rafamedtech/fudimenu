import type { MenuItem } from '@/types/domain';

/**
 * Public, customer-facing menu attributes only. These describe what a comensal
 * sees on a dish (diet suitability, allergen warnings) — NOT ingredients,
 * recipes, inventory, costs or nutritional calculation. The restaurant owns and
 * declares this information; FudiMenu only renders it.
 */
export const DIETARY_TAGS = ['vegan', 'vegetarian', 'gluten_free', 'spicy'] as const;
export const ALLERGEN_TAGS = [
  'dairy',
  'nuts',
  'peanuts',
  'gluten',
  'shellfish',
  'fish',
  'eggs',
  'soy',
  'sesame',
] as const;

export type DietaryTag = (typeof DIETARY_TAGS)[number];
export type AllergenTag = (typeof ALLERGEN_TAGS)[number];

/** Max tags per list — keeps badge rows from overflowing the UI. */
export const MAX_TAGS_PER_LIST = 12;

const DIETARY_SET: ReadonlySet<string> = new Set(DIETARY_TAGS);
const ALLERGEN_SET: ReadonlySet<string> = new Set(ALLERGEN_TAGS);

/**
 * Reject anything outside the allowlist and dedupe, preserving allowlist order
 * so render order is deterministic regardless of input order. Used by both the
 * zod transform (server validation) and as the canonical normalizer.
 */
export function normalizeDietaryTags(values: readonly string[]): DietaryTag[] {
  const seen = new Set(values);
  return DIETARY_TAGS.filter((tag) => seen.has(tag));
}

export function normalizeAllergenTags(values: readonly string[]): AllergenTag[] {
  const seen = new Set(values);
  return ALLERGEN_TAGS.filter((tag) => seen.has(tag));
}

export function isDietaryTag(value: string): value is DietaryTag {
  return DIETARY_SET.has(value);
}

export function isAllergenTag(value: string): value is AllergenTag {
  return ALLERGEN_SET.has(value);
}

export type ItemBadge = {
  /** Stable key for React lists and labels lookup. */
  key: DietaryTag | AllergenTag;
  kind: 'dietary' | 'allergen';
  label: string;
};

export type BadgeLabels = {
  dietary: Record<DietaryTag, string>;
  allergen: Record<AllergenTag, string>;
};

/**
 * Ordered badge descriptors the public UI maps over. Dietary first (positive
 * suitability), then allergen warnings. Order within each group follows the
 * allowlist via the normalizers, so output is deterministic. Pure — render is a
 * trivial map over this, which keeps it unit-testable without a DOM.
 */
export function getItemBadges(
  item: Pick<MenuItem, 'dietaryTags' | 'allergenTags'>,
  labels: BadgeLabels,
): ItemBadge[] {
  const dietary = normalizeDietaryTags(item.dietaryTags ?? []).map(
    (key): ItemBadge => ({ key, kind: 'dietary', label: labels.dietary[key] }),
  );
  const allergen = normalizeAllergenTags(item.allergenTags ?? []).map(
    (key): ItemBadge => ({ key, kind: 'allergen', label: labels.allergen[key] }),
  );
  return [...dietary, ...allergen];
}

/**
 * Spoken summary of an item's badges, folded into the card button's accessible
 * name. The visual badges live inside a button whose `aria-label` would
 * otherwise hide them from screen readers, so their meaning must be carried by
 * the name itself. Allergens get a "contains" prefix so warnings aren't read as
 * suitability. Returns '' when there are no badges (caller skips it).
 */
export function getItemBadgesAccessibleLabel(
  badges: ItemBadge[],
  strings: { contains: string },
): string {
  const dietary = badges.filter((b) => b.kind === 'dietary').map((b) => b.label);
  const allergen = badges.filter((b) => b.kind === 'allergen').map((b) => b.label);

  const parts: string[] = [];
  if (dietary.length > 0) parts.push(dietary.join(', '));
  if (allergen.length > 0) parts.push(`${strings.contains}: ${allergen.join(', ')}`);
  return parts.join('. ');
}
