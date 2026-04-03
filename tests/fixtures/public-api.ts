import type { PublicRestaurantResponse, PublicRestaurantsResponse } from '~~/types/api'

import {
  buildPublicMenuCategory,
  buildPublicMenuItem,
  buildPublicRestaurantDetail,
  buildPublicRestaurantSummary
} from '~~/tests/factories/domain'

export const publicRestaurantSummaryFixture = buildPublicRestaurantSummary()

export const publicRestaurantDetailFixture = buildPublicRestaurantDetail({
  categories: [
    buildPublicMenuCategory({
      name: 'Entradas',
      slug: 'entradas',
      items: [
        buildPublicMenuItem({
          name: 'Queso fundido con chorizo',
          price: '129.00'
        })
      ]
    })
  ]
})

export const publicRestaurantsResponseFixture: PublicRestaurantsResponse = {
  restaurants: [publicRestaurantSummaryFixture]
}

export const publicRestaurantResponseFixture: PublicRestaurantResponse = {
  restaurant: publicRestaurantDetailFixture
}
