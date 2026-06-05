import { describe, expect, it } from 'vitest';
import { parseCsv } from '../../src/lib/import/csv';
import { mapRows, normalizeHeader, parsePrice } from '../../src/lib/import/menu-import';

function grid(csv: string) {
  return parseCsv(csv);
}

describe('normalizeHeader', () => {
  it('lowercases and strips accents', () => {
    expect(normalizeHeader('  Descripción ')).toBe('descripcion');
    expect(normalizeHeader('SECCIÓN')).toBe('seccion');
  });
});

describe('parsePrice', () => {
  it('parses plain and decimal prices to cents', () => {
    expect(parsePrice('120')).toBe(12000);
    expect(parsePrice('120.50')).toBe(12050);
  });

  it('strips currency symbol and thousands separators', () => {
    expect(parsePrice('$1,234.50')).toBe(123450);
  });

  it('rejects non-numeric, empty, and non-positive values', () => {
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('gratis')).toBeNull();
    expect(parsePrice('0')).toBeNull();
    expect(parsePrice('-5')).toBeNull();
  });
});

describe('mapRows', () => {
  it('reports missing required headers', () => {
    const result = mapRows(grid('descripcion,categoria\nfoo,bar'));
    expect(result).toEqual({ ok: false, reason: 'missing_headers', missing: ['name', 'price'] });
  });

  it('maps Spanish + English aliased headers into typed rows', () => {
    // Why: importing must accept the same header in either language without a code change.
    const result = mapRows(
      grid('nombre,price,Descripción,categoria,seccion\nTacos,120,Ricos,Antojitos,Comida'),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.errors).toEqual([]);
    expect(result.valid).toEqual([
      {
        name: 'Tacos',
        description: 'Ricos',
        priceCents: 12000,
        categoryName: 'Antojitos',
        sectionName: 'Comida',
      },
    ]);
  });

  it('treats optional columns as null when absent', () => {
    const result = mapRows(grid('nombre,precio\nAgua,25'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.valid[0]).toEqual({
      name: 'Agua',
      description: null,
      priceCents: 2500,
      categoryName: null,
      sectionName: null,
    });
  });

  it('collects per-row errors with the spreadsheet row number and skips bad rows', () => {
    // Why: a single bad row must point the user at the exact line to fix, not abort silently.
    const result = mapRows(grid('nombre,precio\nBueno,100\nMalo,gratis\n,50'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].name).toBe('Bueno');
    expect(result.errors).toEqual([
      { rowNumber: 3, field: 'price', message: 'Precio inválido o vacío' },
      { rowNumber: 4, field: 'name', message: 'Pon un nombre' },
    ]);
  });

  it('rejects prices above the item maximum', () => {
    const result = mapRows(grid('nombre,precio\nCaro,99999999'));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0]).toMatchObject({ rowNumber: 2, field: 'priceCents' });
  });
});
