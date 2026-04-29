import 'server-only';
import { MockMenuRepository } from '@/server/repositories/mock-menu.repository';
import type { IMenuRepository } from '@/server/repositories/menu.repository';

export async function getMenuRepository(): Promise<IMenuRepository> {
  if (process.env.USE_MOCKS === 'true') return new MockMenuRepository();

  const { PrismaMenuRepository } = await import('@/server/repositories/prisma-menu.repository');
  return new PrismaMenuRepository();
}
