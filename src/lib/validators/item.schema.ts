import { z } from 'zod';

export const itemSchema = z
  .object({
    id: z.string().min(1).optional(),
    categoryId: z.string().min(1).nullable(),
    name: z.string().min(1, 'Pon un nombre').max(80),
    description: z.string().max(500).nullable().optional(),
    priceCents: z.number().int().min(1, 'Pon un precio mayor a 0').max(10_000_00),
    isSpecialToday: z.boolean().optional(),
    specialPrice: z.number().int().min(1, 'Precio especial debe ser mayor a 0').max(10_000_00).nullable().optional(),
    currency: z.string().length(3).default('MXN'),
    imageUrl: z.string().url().nullable().optional(),
    isAvailable: z.boolean().optional(),
    translations: z
      .array(
        z.object({
          locale: z.enum(['es', 'en']),
          name: z.string().max(80).nullable().optional(),
          description: z.string().max(500).nullable().optional(),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isSpecialToday && data.specialPrice != null && data.specialPrice >= data.priceCents) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El precio especial debe ser menor al precio normal',
        path: ['specialPrice'],
      });
    }
  });

export const categorySchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(40),
  coverImageUrl: z.string().url().nullable().optional(),
  sectionId: z.string().min(1).nullable().optional(),
  sortOrder: z.number().int().default(0),
  isVisible: z.boolean().default(true),
});

export const reorderCategoriesSchema = z.object({
  sectionId: z.string().min(1).nullable(),
  categoryIds: z.array(z.string().min(1)).min(1).max(100),
});

export const tenantUpdateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  slug: z
    .string()
    .min(4)
    .max(48)
    .regex(/^[a-z0-9-]+$/, 'Solo letras, números y guiones')
    .optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex inválido')
    .optional(),
  logoUrl: z.string().url().nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  logoShape: z.enum(['rectangular', 'square', 'round']).optional(),
  whatsappPhone: z.string().max(32).nullable().optional(),
  businessHours: z.string().max(120).nullable().optional(),
});

export type ItemInput = z.infer<typeof itemSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
export type TenantUpdateInput = z.infer<typeof tenantUpdateSchema>;
