import 'dotenv/config'

import { defineConfig } from 'prisma/config'

const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL

if (!migrationUrl) {
  throw new Error('Set DATABASE_URL or DIRECT_URL before running Prisma CLI commands.')
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts'
  },
  datasource: {
    url: migrationUrl
  }
})
