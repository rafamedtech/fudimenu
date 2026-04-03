import type {
  AppUser,
  DashboardMenuCategory,
  DashboardMenuItem,
  DashboardRestaurant,
  PublicRestaurantDetail,
  PublicRestaurantSummary
} from '~~/types/domain'

export interface AuthMeResponse {
  user: AppUser
}

export interface PublicRestaurantsResponse {
  restaurants: PublicRestaurantSummary[]
}

export interface PublicRestaurantResponse {
  restaurant: PublicRestaurantDetail
}

export interface DashboardRestaurantsResponse {
  restaurants: DashboardRestaurant[]
}

export interface DashboardRestaurantResponse {
  restaurant: DashboardRestaurant
}

export interface DashboardCategoriesResponse {
  categories: DashboardMenuCategory[]
}

export interface DashboardItemsResponse {
  items: DashboardMenuItem[]
}
