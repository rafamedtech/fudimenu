import 'server-only';
import { getPrisma } from '@/lib/db/prisma';
import { slugify } from '@/lib/utils';

const DEFAULT_SLUG = 'restaurante';
const MAX_SLUG_LENGTH = 48;
const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'auth',
  'dashboard',
  'login',
  'logout',
  'menu',
  'onboarding',
  'qr',
  'settings',
  'signup',
  'www',
]);

function randomSlugSuffix() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 4);
}

function appendSlugSuffix(base: string, suffix: string) {
  const maxBaseLength = MAX_SLUG_LENGTH - suffix.length - 1;
  const trimmedBase = base.slice(0, maxBaseLength).replace(/-+$/g, '') || DEFAULT_SLUG;
  return `${trimmedBase}-${suffix}`;
}

export function normalizeTenantSlug(input: string) {
  return (slugify(input) || DEFAULT_SLUG).slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, '') || DEFAULT_SLUG;
}

export function buildSlugSuggestions(
  input: string,
  createRandomSuffix: () => string = randomSlugSuffix,
) {
  const base = normalizeTenantSlug(input);
  return [
    base,
    appendSlugSuffix(base, 'tj'),
    appendSlugSuffix(base, '2'),
    appendSlugSuffix(base, createRandomSuffix()),
  ];
}

async function isSlugReserved(slug: string, currentTenantId?: string) {
  if (RESERVED_SLUGS.has(slug)) return true;

  const prisma = getPrisma();
  const [tenant, history] = await Promise.all([
    prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    }),
    prisma.slugHistory.findUnique({
      where: { slug },
      select: { tenantId: true, deletedAt: true },
    }),
  ]);

  if (currentTenantId && tenant?.id === currentTenantId) return false;
  if (tenant) return true;
  return Boolean(history && !history.deletedAt && history.tenantId !== currentTenantId);
}

type SlugAvailabilityOptions = {
  currentTenantId?: string;
  createRandomSuffix?: () => string;
};

export async function checkTenantSlugAvailability(
  input: string,
  options: SlugAvailabilityOptions = {},
) {
  const candidates = buildSlugSuggestions(input, options.createRandomSuffix);
  const [requestedSlug] = candidates;

  for (const candidate of candidates) {
    if (!(await isSlugReserved(candidate, options.currentTenantId))) {
      return {
        available: candidate === requestedSlug,
        suggestion: candidate,
      };
    }
  }

  const fallback = appendSlugSuffix(requestedSlug, randomSlugSuffix());
  return {
    available: false,
    suggestion: fallback,
  };
}
