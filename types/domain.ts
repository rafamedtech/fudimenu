import type { RestaurantThemeConfig } from '~~/lib/restaurant-theme'

export type GlobalRole = 'ADMIN' | 'RESTAURANT_OWNER' | 'USER'
export type RestaurantMembershipRole = 'OWNER' | 'MANAGER'

export interface RestaurantMembershipSummary {
  restaurantId: string
  restaurantName: string
  restaurantSlug: string
  role: RestaurantMembershipRole
}

export interface AppUser {
  id: string
  email: string
  fullName: string | null
  role: GlobalRole
  memberships: RestaurantMembershipSummary[]
}

export interface PublicRestaurantSummary {
  id: string
  name: string
  slug: string
  description: string | null
  coverImageUrl: string | null
  city: string | null
  zone: string | null
  cuisineType: string | null
  themeConfig: RestaurantThemeConfig
}

export interface PublicMenuItem {
  id: string
  name: string
  description: string | null
  price: string
  imageUrl: string | null
  sortOrder: number
}

export interface PublicMenuCategory {
  id: string
  name: string
  slug: string | null
  sortOrder: number
  items: PublicMenuItem[]
}

export interface PublicRestaurantDetail extends PublicRestaurantSummary {
  address: string | null
  phone: string | null
  whatsapp: string | null
  businessHours: string | null
  logoUrl: string | null
  categories: PublicMenuCategory[]
}

export type DashboardRestaurantSubmitAction = 'draft' | 'publish'

export interface DashboardRestaurantPayload {
  name: string
  slug: string
  description: string
  logoUrl: string
  coverImageUrl: string
  address: string
  city: string
  zone: string
  phone: string
  whatsapp: string
  cuisineType: string
  businessHours: string
  isPublished: boolean
  themeConfig: RestaurantThemeConfig
}

export interface DashboardRestaurant {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  address: string | null
  city: string | null
  zone: string | null
  phone: string | null
  whatsapp: string | null
  cuisineType: string | null
  businessHours: string | null
  isPublished: boolean
  themeConfig: RestaurantThemeConfig
  createdAt: string
  updatedAt: string
  membershipRole: RestaurantMembershipRole
}

export interface DashboardMenuCategory {
  id: string
  restaurantId: string
  name: string
  slug: string | null
  sortOrder: number
  isActive: boolean
  itemCount: number
  createdAt: string
  updatedAt: string
}

export interface DashboardMenuItem {
  id: string
  restaurantId: string
  categoryId: string
  categoryName: string
  name: string
  description: string | null
  price: string
  imageUrl: string | null
  isAvailable: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}
