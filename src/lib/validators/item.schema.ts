import { z } from 'zod';

export const itemSchema = z.object({
  id: z.string().min(1).optional(),
  categoryId: z.string().min(1).nullable(),
  name: z.string().min(1, 'Pon un nombre').max(80),
  description: z.string().max(500).nullable().optional(),
  priceCents: z.number().int().min(0).max(10_000_00),
  isSpecialToday: z.boolean().optional(),
  specialPrice: z.number().int().min(0).max(10_000_00).nullable().optional(),
  currency: z.string().length(3).default('MXN'),
  imageUrl: z.string().url().nullable().optional(),
  isAvailable: z.boolean().default(true),
});

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(40),
  sortOrder: z.number().int().default(0),
  isVisible: z.boolean().default(true),
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
  whatsappPhone: z.string().max(32).nullable().optional(),
});

export type ItemInput = z.infer<typeof itemSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type TenantUpdateInput = z.infer<typeof tenantUpdateSchema>;
