import 'server-only';
import { MockMenuRepository } from '@/server/repositories/mock-menu.repository';
import type { IMenuRepository } from '@/server/repositories/menu.repository';

let mockSingleton: MockMenuRepository | null = null;

export async function getMenuRepository(): Promise<IMenuRepository> {
  if (process.env.USE_MOCKS === 'true') {
    mockSingleton ??= new MockMenuRepository();
    return mockSingleton;
  }

  const { PrismaMenuRepository } = await import('@/server/repositories/prisma-menu.repository');
  return new PrismaMenuRepository();
}

export function __resetMockRepository() {
  mockSingleton = null;
}
