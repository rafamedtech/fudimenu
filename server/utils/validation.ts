import { z } from 'zod'

import {
  defaultRestaurantThemeConfig,
  restaurantThemeColorModeOptions,
  restaurantThemeFontOptions,
  restaurantThemeIconOptions,
  restaurantThemeNeutralOptions,
  restaurantThemePrimaryOptions,
  restaurantThemeRadiusOptions
} from '~~/lib/restaurant-theme'

function emptyToUndefined(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : undefined
}

function optionalString(maxLength: number) {
  return z
    .preprocess(emptyToUndefined, z.string().max(maxLength))
    .optional()
    .transform((value) => value ?? null)
}

function optionalUrl(maxLength = 1000) {
  return z
    .preprocess(emptyToUndefined, z.string().url().max(maxLength))
    .optional()
    .transform((value) => value ?? null)
}

export const uuidSchema = z.string().uuid('El identificador no es válido.')

export const slugSchema = z
  .string()
  .trim()
  .min(2, 'El slug es requerido.')
  .max(80, 'El slug no puede exceder 80 caracteres.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo permite letras minúsculas, números y guiones.')

export const optionalSlugSchema = z
  .preprocess(emptyToUndefined, slugSchema)
  .optional()
  .transform((value) => value ?? null)

export const restaurantThemeConfigSchema = z.object({
  primary: z.enum(restaurantThemePrimaryOptions),
  neutral: z.enum(restaurantThemeNeutralOptions),
  radius: z.enum(restaurantThemeRadiusOptions),
  font: z.enum(restaurantThemeFontOptions),
  icons: z.enum(restaurantThemeIconOptions),
  colorMode: z.enum(restaurantThemeColorModeOptions)
})

export const restaurantPayloadSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es requerido.').max(120),
  slug: slugSchema,
  description: optionalString(600),
  logoUrl: optionalUrl(),
  coverImageUrl: optionalUrl(),
  address: optionalString(240),
  city: optionalString(120),
  zone: optionalString(120),
  phone: optionalString(60),
  whatsapp: optionalString(60),
  cuisineType: optionalString(120),
  businessHours: optionalString(120),
  isPublished: z.boolean().default(false),
  themeConfig: restaurantThemeConfigSchema.default(defaultRestaurantThemeConfig)
})

export const categoryPayloadSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es requerido.').max(120),
  slug: optionalSlugSchema,
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
})

export const menuItemPayloadSchema = z.object({
  categoryId: uuidSchema,
  name: z.string().trim().min(2, 'El nombre es requerido.').max(120),
  description: optionalString(400),
  price: z.preprocess(
    emptyToUndefined,
    z.coerce.number().positive('El precio debe ser mayor a cero.')
  ),
  imageUrl: optionalUrl(),
  isAvailable: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0)
})

export function parseUuidParam(value: unknown, _fieldName: string) {
  return uuidSchema.parse(value)
}
