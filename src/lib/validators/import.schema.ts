import { z } from 'zod';

/** Upper bound for item price, in cents. Matches `itemSchema` in item.schema.ts. */
export const MAX_PRICE_CENTS = 10_000_00;

/**
 * One menu row resolved from a CSV file, ready to commit.
 *
 * Bounds mirror the canonical schemas so importing can never create rows the
 * single-item editor would reject: item name ≤ 80 / description ≤ 500
 * (item.schema.ts), category & section name ≤ 40 (item/section schema).
 */
export const importItemSchema = z.object({
  name: z.string().min(1, 'Pon un nombre').max(80, 'El nombre es muy largo (máx 80)'),
  description: z.string().max(500, 'La descripción es muy larga (máx 500)').nullable(),
  priceCents: z
    .number()
    .int()
    .min(1, 'El precio debe ser mayor a 0')
    .max(MAX_PRICE_CENTS, 'El precio es demasiado alto'),
  categoryName: z.string().max(40, 'La categoría es muy larga (máx 40)').nullable(),
  sectionName: z.string().max(40, 'La sección es muy larga (máx 40)').nullable(),
});

export type ImportItem = z.infer<typeof importItemSchema>;

/** Hard cap on rows per import — keeps the commit synchronous and cheap. */
export const MAX_IMPORT_ROWS = 500;

/**
 * The confirmed payload the client sends after the user reviews/edits the
 * preview. The Server Action re-validates every row against `importItemSchema`
 * before persisting — edited rows are trusted only after this pass.
 */
export const importPayloadSchema = z.object({
  rows: z.array(importItemSchema).min(1, 'No hay filas para importar').max(MAX_IMPORT_ROWS),
});

export type ImportPayload = z.infer<typeof importPayloadSchema>;
