import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function getPrisma() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL or DIRECT_URL. Add your Supabase Postgres URL to .env.');
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    });
  }

  return globalForPrisma.prisma;
}
