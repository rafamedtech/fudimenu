import {
  getAlternateLocale,
  getItemTranslationStatus,
  type TranslationStatus,
} from '@/lib/menu-i18n';
import type { Locale, MenuItem } from '@/types/domain';

const STATUS_STYLES: Record<TranslationStatus, { label: string; className: string; dot: string }> = {
  translated: {
    label: 'Traducido',
    className: 'border-green-300 bg-green-50 text-green-800',
    dot: 'bg-green-500',
  },
  incomplete: {
    label: 'Incompleto',
    className: 'border-mostaza-300 bg-mostaza-50 text-mostaza-700',
    dot: 'bg-mostaza-500',
  },
  untranslated: {
    label: 'Sin traducir',
    className: 'border-ink-200 bg-[var(--brand-surface-strong)] text-ink-500',
    dot: 'bg-ink-300',
  },
};

export function TranslationStatusBadge({
  item,
  defaultLocale,
}: {
  item: MenuItem;
  defaultLocale: Locale;
}) {
  const status = getItemTranslationStatus(item, defaultLocale);
  const localeCode = getAlternateLocale(defaultLocale).toUpperCase();
  const style = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold ${style.className}`}
    >
      <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden />
      {localeCode} · {style.label}
    </span>
  );
}
