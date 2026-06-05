import type { Locale, MenuItem } from '@/types/domain';

/**
 * Swap an item's name/description to the comensal's locale when a translation
 * exists. Falls back per-field to the base (default-locale) text so a missing
 * or blank translation never shows an empty title/description on the public menu.
 */
export function localizeMenuItem(
  item: MenuItem,
  locale: Locale,
  defaultLocale: Locale,
): MenuItem {
  if (locale === defaultLocale) return item;

  const translation = item.translations?.find((t) => t.locale === locale);
  if (!translation) return item;

  const name = translation.name?.trim() ? translation.name : item.name;
  const description = translation.description?.trim()
    ? translation.description
    : item.description;

  if (name === item.name && description === item.description) return item;
  return { ...item, name, description };
}

export function localizeMenuItems(
  items: MenuItem[],
  locale: Locale,
  defaultLocale: Locale,
): MenuItem[] {
  return items.map((item) => localizeMenuItem(item, locale, defaultLocale));
}

export type TranslationStatus = 'translated' | 'incomplete' | 'untranslated';

/** The locale that needs translating: the one that is not the tenant's default. */
export function getAlternateLocale(defaultLocale: Locale): Locale {
  return defaultLocale === 'es' ? 'en' : 'es';
}

/**
 * Translation coverage for the alternate locale, derived only from the item's
 * translated name/description (no operational data). Required fields mirror the
 * base content the comensal sees: name is always required; description only
 * counts when the base item has one. Blank-only translations read as untranslated.
 */
export function getItemTranslationStatus(
  item: MenuItem,
  defaultLocale: Locale,
): TranslationStatus {
  const locale = getAlternateLocale(defaultLocale);
  const translation = item.translations?.find((t) => t.locale === locale);

  const hasName = Boolean(translation?.name?.trim());
  const hasDescription = Boolean(translation?.description?.trim());
  const baseHasDescription = Boolean(item.description?.trim());

  const required = baseHasDescription ? 2 : 1;
  const present = (hasName ? 1 : 0) + (baseHasDescription && hasDescription ? 1 : 0);

  if (present === 0) return 'untranslated';
  if (present < required) return 'incomplete';
  return 'translated';
}
