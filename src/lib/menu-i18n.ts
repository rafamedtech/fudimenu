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
