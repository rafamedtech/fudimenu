import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

config({ path: '.env.local' });
config({ path: '.env' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  experimental: {
    externalTables: true,
  },
  migrations: {
    path: 'prisma/migrations',
    initShadowDb: `
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE OR REPLACE FUNCTION auth.uid()
      RETURNS uuid
      LANGUAGE sql
      STABLE
      AS 'SELECT NULL::uuid';
    `,
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
});
