import { importItemSchema, type ImportItem } from '@/lib/validators/import.schema';

export type { ImportItem };

/** A single cell-level problem, addressed by spreadsheet row number for the user. */
export type ImportRowError = {
  /** 1-based spreadsheet row number (header is row 1, first data row is 2). */
  rowNumber: number;
  field: string;
  message: string;
};

export type MapRowsResult =
  | { ok: false; reason: 'missing_headers'; missing: string[] }
  | { ok: true; valid: ImportItem[]; errors: ImportRowError[] };

type FieldKey = 'name' | 'description' | 'price' | 'category' | 'section';

/** Header aliases, Spanish-first. Compared after normalization (lowercase, no accents). */
const HEADER_ALIASES: Record<FieldKey, string[]> = {
  name: ['nombre', 'name', 'platillo', 'producto'],
  description: ['descripcion', 'description', 'detalle'],
  price: ['precio', 'price'],
  category: ['categoria', 'category'],
  section: ['seccion', 'section'],
};

const REQUIRED_FIELDS: FieldKey[] = ['name', 'price'];

/** Lowercase, strip diacritics, collapse whitespace. */
export function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Parse a human-typed price into integer cents, or null if unparseable / ≤ 0.
 * Accepts `$120`, `120.50`, `1,234.50` (comma = thousands separator, dot = decimal).
 * Upper bound is enforced by `importItemSchema`, not here.
 */
export function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.,-]/g, '').replace(/,/g, '').trim();
  if (!cleaned) return null;

  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;

  const cents = Math.round(value * 100);
  return cents >= 1 ? cents : null;
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Map a parsed CSV grid (header row + data rows) into validated import items.
 * Returns `missing_headers` when a required column is absent; otherwise returns
 * the valid rows plus per-cell errors for rows that failed validation.
 */
export function mapRows(grid: string[][]): MapRowsResult {
  const header = grid[0] ?? [];
  const normalized = header.map(normalizeHeader);

  const columnIndex: Partial<Record<FieldKey, number>> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [FieldKey, string[]][]) {
    const idx = normalized.findIndex((h) => aliases.includes(h));
    if (idx !== -1) columnIndex[field] = idx;
  }

  const missing = REQUIRED_FIELDS.filter((field) => columnIndex[field] === undefined);
  if (missing.length > 0) {
    return { ok: false, reason: 'missing_headers', missing };
  }

  const valid: ImportItem[] = [];
  const errors: ImportRowError[] = [];

  for (let i = 1; i < grid.length; i++) {
    const rowNumber = i + 1;
    const cells = grid[i];
    const cellAt = (field: FieldKey) => {
      const idx = columnIndex[field];
      return idx === undefined ? undefined : cells[idx];
    };

    const priceCents = parsePrice(cellAt('price') ?? '');
    if (priceCents === null) {
      errors.push({ rowNumber, field: 'price', message: 'Precio inválido o vacío' });
      continue;
    }

    const candidate = {
      name: emptyToNull(cellAt('name')) ?? '',
      description: emptyToNull(cellAt('description')),
      priceCents,
      categoryName: emptyToNull(cellAt('category')),
      sectionName: emptyToNull(cellAt('section')),
    };

    const parsed = importItemSchema.safeParse(candidate);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({
          rowNumber,
          field: String(issue.path[0] ?? 'row'),
          message: issue.message,
        });
      }
      continue;
    }

    valid.push(parsed.data);
  }

  return { ok: true, valid, errors };
}
