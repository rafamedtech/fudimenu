import 'server-only';
import { Prisma, type Referral } from '@/generated/prisma/client';
import { getPrisma } from '@/lib/db/prisma';
import { slugify } from '@/lib/utils';

const REFERRAL_SUFFIX_LENGTH = 4;
const REFERRAL_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const REFERRAL_BASE_URL = 'https://fudimenu.app/r';
const MAX_CODE_GENERATION_ATTEMPTS = 8;

type ReferralLink = Pick<Referral, 'id' | 'code' | 'status' | 'creditedAt'> & {
  url: string;
};

type GetOrCreateReferralInput = {
  tenantId: string;
  referrerId: string;
};

function randomReferralSuffix() {
  const bytes = new Uint8Array(REFERRAL_SUFFIX_LENGTH);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => REFERRAL_ALPHABET[byte % REFERRAL_ALPHABET.length]).join('');
}

function toReferralLink(referral: Pick<Referral, 'id' | 'code' | 'status' | 'creditedAt'>): ReferralLink {
  return {
    ...referral,
    url: getReferralUrl(referral.code),
  };
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export function buildReferralCode(tenantSlug: string, suffix = randomReferralSuffix()) {
  const normalizedSlug = slugify(tenantSlug) || 'tenant';
  return `${normalizedSlug}-${suffix.toLowerCase()}`;
}

export function getReferralUrl(code: string) {
  return `${REFERRAL_BASE_URL}/${code}`;
}

export const referralService = {
  async getOrCreateForTenant(input: GetOrCreateReferralInput): Promise<ReferralLink> {
    const prisma = getPrisma();
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: input.tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found.');
    }

    const existingReferral = await prisma.referral.findUnique({
      where: { referredTenantId: tenant.id },
      select: {
        id: true,
        code: true,
        status: true,
        creditedAt: true,
      },
    });

    if (existingReferral) {
      return toReferralLink(existingReferral);
    }

    for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
      try {
        const referral = await prisma.referral.create({
          data: {
            referredTenantId: tenant.id,
            referrerId: input.referrerId,
            code: buildReferralCode(tenant.slug),
          },
          select: {
            id: true,
            code: true,
            status: true,
            creditedAt: true,
          },
        });

        return toReferralLink(referral);
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }

        const referralCreatedConcurrently = await prisma.referral.findUnique({
          where: { referredTenantId: tenant.id },
          select: {
            id: true,
            code: true,
            status: true,
            creditedAt: true,
          },
        });

        if (referralCreatedConcurrently) {
          return toReferralLink(referralCreatedConcurrently);
        }
      }
    }

    throw new Error('Unable to generate a unique referral code.');
  },
};
