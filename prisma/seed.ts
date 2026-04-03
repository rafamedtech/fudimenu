import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'

import { Prisma, PrismaClient } from '../generated/prisma/client'

import { demoRestaurants } from '../lib/demo-data'

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL or DIRECT_URL is required to run the Prisma seed.')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
})

async function seedRestaurant(
  restaurant: (typeof demoRestaurants)[number]
) {
  const { categories, ...restaurantData } = restaurant

  await prisma.$transaction(async (tx) => {
    const upsertedRestaurant = await tx.restaurant.upsert({
      where: { slug: restaurant.slug },
      update: restaurantData,
      create: restaurantData
    })

    await tx.menuCategory.deleteMany({
      where: {
        restaurantId: upsertedRestaurant.id
      }
    })

    for (const category of categories) {
      const { items, ...categoryData } = category

      await tx.menuCategory.create({
        data: {
          restaurantId: upsertedRestaurant.id,
          ...categoryData,
          items: {
            create: items.map((item) => ({
              ...item,
              price: new Prisma.Decimal(item.price)
            }))
          }
        }
      })
    }
  })
}

async function seedRestaurants() {
  for (const restaurant of demoRestaurants) {
    await seedRestaurant(restaurant)
  }
}

async function main() {
  await seedRestaurants()
  console.info(`Seeded ${demoRestaurants.length} restaurants for the MVP demo.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error('Seed failed', error)
    await prisma.$disconnect()
    process.exit(1)
  })
