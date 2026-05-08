import { z } from 'zod';

export const sectionSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1, 'Pon un nombre').max(40),
  coverImageUrl: z.string().url().nullable().optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex inválido')
    .default('#FFF8E7'),
  sortOrder: z.number().int().default(0),
  isVisible: z.boolean().default(true),
});

export const reorderSectionsSchema = z.object({
  sectionIds: z.array(z.string().min(1)).min(1).max(50),
});

export type SectionInput = z.infer<typeof sectionSchema>;
export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>;
