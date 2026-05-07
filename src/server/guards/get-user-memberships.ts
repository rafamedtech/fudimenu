import 'server-only';
import { getPrisma, resetPrisma } from '@/lib/db/prisma';
import type { Plan } from '@/types/domain';

export type UserMembership = {
  tenantId: string;
  role: string;
  tenant: {
    name: string;
    slug: string;
    plan: Plan;
  };
};

/**
 * Auth bootstrap helper. Lista membresías de un user.
 *
 * IMPORTANTE: este es uno de los pocos lugares donde se hace findMany
 * sin tenantId - el caller AUN no tiene tenantId verificado, justamente
 * lo esta descubriendo. NO copiar este patron fuera de auth bootstrap.
 */
export async function getUserMemberships(
  userId: string,
  retry = false,
): Promise<UserMembership[]> {
  const prisma = getPrisma();

  try {
    // eslint-disable-next-line fudimenu/require-tenant-id-in-prisma-findmany
    const rows = await prisma.membership.findMany({
      where: { userId, deletedAt: null },
      select: {
        tenantId: true,
        role: true,
        tenant: {
          select: { name: true, slug: true, plan: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) => ({
      ...row,
      tenant: { ...row.tenant, plan: row.tenant.plan as Plan },
    }));
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (!retry && (code === 'P1001' || code === 'P1017')) {
      resetPrisma();
      return getUserMemberships(userId, true);
    }
    throw err;
  }
}
