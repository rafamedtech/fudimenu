import { defaultRestaurantThemeConfig } from '~~/lib/restaurant-theme'
import type {
  AppUser,
  DashboardMenuCategory,
  DashboardMenuItem,
  DashboardRestaurant,
  DashboardRestaurantPayload,
  PublicMenuCategory,
  PublicMenuItem,
  PublicRestaurantDetail,
  PublicRestaurantSummary,
  RestaurantMembershipSummary
} from '~~/types/domain'

let sequence = 0

function nextUuid() {
  sequence += 1
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`
}

export function buildRestaurantMembershipSummary(
  overrides: Partial<RestaurantMembershipSummary> = {}
): RestaurantMembershipSummary {
  return {
    restaurantId: overrides.restaurantId ?? nextUuid(),
    restaurantName: overrides.restaurantName ?? 'Brasa Norte',
    restaurantSlug: overrides.restaurantSlug ?? 'brasa-norte',
    role: overrides.role ?? 'OWNER'
  }
}

export function buildAppUser(overrides: Partial<AppUser> = {}): AppUser {
  return {
    id: overrides.id ?? nextUuid(),
    email: overrides.email ?? 'owner@fudimenu.test',
    fullName: overrides.fullName ?? 'Owner Demo',
    role: overrides.role ?? 'USER',
    memberships: overrides.memberships ?? []
  }
}

export function buildPublicMenuItem(overrides: Partial<PublicMenuItem> = {}): PublicMenuItem {
  return {
    id: overrides.id ?? nextUuid(),
    name: overrides.name ?? 'Taco de rib eye',
    description: overrides.description ?? 'Rib eye, cebolla asada y salsa tatemada.',
    price: overrides.price ?? '74.00',
    imageUrl: overrides.imageUrl ?? null,
    sortOrder: overrides.sortOrder ?? 1
  }
}

export function buildPublicMenuCategory(
  overrides: Partial<PublicMenuCategory> = {}
): PublicMenuCategory {
  return {
    id: overrides.id ?? nextUuid(),
    name: overrides.name ?? 'Tacos',
    slug: overrides.slug ?? 'tacos',
    sortOrder: overrides.sortOrder ?? 1,
    items: overrides.items ?? [buildPublicMenuItem()]
  }
}

export function buildPublicRestaurantSummary(
  overrides: Partial<PublicRestaurantSummary> = {}
): PublicRestaurantSummary {
  return {
    id: overrides.id ?? nextUuid(),
    name: overrides.name ?? 'Brasa Norte',
    slug: overrides.slug ?? 'brasa-norte',
    description: overrides.description ?? 'Carnes y tacos para compartir.',
    coverImageUrl: overrides.coverImageUrl ?? null,
    city: overrides.city ?? 'Tijuana',
    zone: overrides.zone ?? 'Zona Río',
    cuisineType: overrides.cuisineType ?? 'Mexicana contemporánea',
    themeConfig: overrides.themeConfig ?? defaultRestaurantThemeConfig
  }
}

export function buildPublicRestaurantDetail(
  overrides: Partial<PublicRestaurantDetail> = {}
): PublicRestaurantDetail {
  const summary = buildPublicRestaurantSummary(overrides)

  return {
    ...summary,
    address: overrides.address ?? 'Av. Constitución 245',
    phone: overrides.phone ?? '+52 664 123 4567',
    whatsapp: overrides.whatsapp ?? '+52 664 123 4567',
    businessHours: overrides.businessHours ?? 'Lun-Dom 1:00 PM - 11:00 PM',
    logoUrl: overrides.logoUrl ?? null,
    categories: overrides.categories ?? [buildPublicMenuCategory()]
  }
}

export function buildRestaurantPayload(
  overrides: Partial<DashboardRestaurantPayload> = {}
): DashboardRestaurantPayload {
  return {
    name: overrides.name ?? 'Brasa Norte',
    slug: overrides.slug ?? 'brasa-norte',
    description: overrides.description ?? 'Carnes y tacos para compartir.',
    logoUrl: overrides.logoUrl ?? 'https://cdn.fudimenu.test/logos/brasa-norte.png',
    coverImageUrl: overrides.coverImageUrl ?? 'https://cdn.fudimenu.test/covers/brasa-norte.jpg',
    address: overrides.address ?? 'Av. Constitución 245',
    city: overrides.city ?? 'Tijuana',
    zone: overrides.zone ?? 'Zona Río',
    phone: overrides.phone ?? '+52 664 123 4567',
    whatsapp: overrides.whatsapp ?? '+52 664 123 4567',
    cuisineType: overrides.cuisineType ?? 'Mexicana contemporánea',
    businessHours: overrides.businessHours ?? 'Lun-Dom 1:00 PM - 11:00 PM',
    isPublished: overrides.isPublished ?? false,
    themeConfig: overrides.themeConfig ?? defaultRestaurantThemeConfig
  }
}

export function buildDashboardRestaurant(
  overrides: Partial<DashboardRestaurant> = {}
): DashboardRestaurant {
  const id = overrides.id ?? nextUuid()
  const slug = overrides.slug ?? 'brasa-norte'
  const now = new Date('2026-04-03T12:00:00.000Z').toISOString()

  return {
    id,
    name: overrides.name ?? 'Brasa Norte',
    slug,
    description: overrides.description ?? 'Carnes y tacos para compartir.',
    logoUrl: overrides.logoUrl ?? 'https://cdn.fudimenu.test/logos/brasa-norte.png',
    coverImageUrl: overrides.coverImageUrl ?? 'https://cdn.fudimenu.test/covers/brasa-norte.jpg',
    address: overrides.address ?? 'Av. Constitución 245',
    city: overrides.city ?? 'Tijuana',
    zone: overrides.zone ?? 'Zona Río',
    phone: overrides.phone ?? '+52 664 123 4567',
    whatsapp: overrides.whatsapp ?? '+52 664 123 4567',
    cuisineType: overrides.cuisineType ?? 'Mexicana contemporánea',
    businessHours: overrides.businessHours ?? 'Lun-Dom 1:00 PM - 11:00 PM',
    isPublished: overrides.isPublished ?? false,
    themeConfig: overrides.themeConfig ?? defaultRestaurantThemeConfig,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    membershipRole: overrides.membershipRole ?? 'OWNER'
  }
}

export function buildDashboardMenuCategory(
  overrides: Partial<DashboardMenuCategory> = {}
): DashboardMenuCategory {
  const now = new Date('2026-04-03T12:00:00.000Z').toISOString()

  return {
    id: overrides.id ?? nextUuid(),
    restaurantId: overrides.restaurantId ?? 'restaurant-brasa',
    name: overrides.name ?? 'Entradas',
    slug: overrides.slug === undefined ? 'entradas' : overrides.slug,
    sortOrder: overrides.sortOrder ?? 0,
    isActive: overrides.isActive ?? true,
    itemCount: overrides.itemCount ?? 0,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now
  }
}

export function buildDashboardMenuItem(
  overrides: Partial<DashboardMenuItem> = {}
): DashboardMenuItem {
  const now = new Date('2026-04-03T12:00:00.000Z').toISOString()

  return {
    id: overrides.id ?? nextUuid(),
    restaurantId: overrides.restaurantId ?? 'restaurant-brasa',
    categoryId: overrides.categoryId ?? 'category-1',
    categoryName: overrides.categoryName ?? 'Entradas',
    name: overrides.name ?? 'Taco gobernador',
    description: overrides.description ?? 'Taco dorado con camarón, queso y salsa tatemada.',
    price: overrides.price ?? '149.00',
    imageUrl: overrides.imageUrl ?? null,
    isAvailable: overrides.isAvailable ?? true,
    sortOrder: overrides.sortOrder ?? 0,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now
  }
}
