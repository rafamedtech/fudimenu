'use server';

import { cookies } from 'next/headers';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { canCreateAnotherMenu } from '@/config/plans';
import { getPrisma } from '@/lib/db/prisma';
import { mockTenant } from '@/lib/mock/data';
import {
  checkTenantSlugAvailability,
  normalizeTenantSlug,
} from '@/server/services/slug.service';
import { tenantService } from '@/server/services/tenant.service';
import { requireAuth } from '@/server/guards/require-auth';
import {
  ACTIVE_TENANT_COOKIE,
  activeTenantCookieOptions,
} from '@/server/tenants/active-tenant-cookie';

function normalizeOptionalText(input: string | null | undefined) {
  const trimmed = input?.trim();
  return trimmed ? trimmed : null;
}

const brandSettingsSchema = z.object({
  slug: z
    .string()
    .min(4, 'Usa minimo 4 caracteres')
    .max(48, 'Usa maximo 48 caracteres')
    .transform((value) => normalizeTenantSlug(value))
    .refine((value) => value.length >= 4 && value.length <= 48, {
      message: 'Usa entre 4 y 48 caracteres',
    })
    .refine((value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), {
      message: 'Usa solo letras, numeros y guiones',
    }),
  logoUrl: z
    .string()
    .url('Usa una URL valida para el logo')
    .or(z.literal(''))
    .transform((value) => normalizeOptionalText(value)),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex invalido'),
});

export async function updateBrandSettingsFormAction(formData: FormData) {
  const ctx = await requireAuth();
  const data = brandSettingsSchema.parse({
    slug: formData.get('slug')?.toString() ?? '',
    logoUrl: formData.get('logoUrl')?.toString() ?? '',
    primaryColor: formData.get('primaryColor')?.toString() ?? '#F4B400',
  });

  if (process.env.USE_MOCKS === 'true') {
    mockTenant.slug = data.slug;
    mockTenant.logoUrl = data.logoUrl ?? null;
    mockTenant.primaryColor = data.primaryColor;
    revalidatePath('/', 'layout');
    redirect('/settings/brand?saved=1');
  }

  const prisma = getPrisma();
  const currentTenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { slug: true },
  });

  if (!currentTenant) redirect('/settings/brand');
  const oldSlug = currentTenant.slug;
  const newSlug = data.slug;

  if (newSlug !== oldSlug) {
    const slugCheck = await checkTenantSlugAvailability(newSlug, {
      currentTenantId: ctx.tenantId,
    });

    if (!slugCheck.available) {
      redirect(`/settings/brand?slugTaken=${encodeURIComponent(slugCheck.suggestion)}`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          slug: newSlug,
          logoUrl: data.logoUrl,
          primaryColor: data.primaryColor,
        },
      });

      await tx.slugHistory.createMany({
        data: [{ tenantId: ctx.tenantId, slug: oldSlug }],
        skipDuplicates: true,
      });
    });
  } else {
    await prisma.tenant.update({
      where: { id: ctx.tenantId },
      data: {
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
      },
    });
  }

  revalidateTag(`menu:${ctx.tenantId}`);
  revalidateTag(`tenant:${ctx.tenantId}`);
  revalidatePath('/', 'layout');
  revalidatePath(`/m/${oldSlug}`);
  revalidatePath(`/m/${newSlug}`);

  redirect('/settings/brand?saved=1');
}

type DeleteTenantError =
  | 'forbidden'
  | 'last_menu'
  | 'plan_limit'
  | 'not_found'
  | 'mock_unsupported';

function failDelete(code: DeleteTenantError) {
  return { ok: false as const, code };
}

export async function deleteTenantAction(input: unknown) {
  const tenantId = z.string().min(1).parse(input);
  const ctx = await requireAuth();

  if (process.env.USE_MOCKS === 'true') {
    return failDelete('mock_unsupported');
  }

  const membership = ctx.memberships.find((m) => m.tenantId === tenantId);
  if (!membership) return failDelete('not_found');
  if (membership.role !== 'owner') return failDelete('forbidden');

  if (!canCreateAnotherMenu(ctx.memberships)) {
    return failDelete('plan_limit');
  }

  if (ctx.memberships.length <= 1) {
    return failDelete('last_menu');
  }

  try {
    await tenantService.softDeleteTenant(tenantId, ctx.userId);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'forbidden') return failDelete('forbidden');
      if (err.message === 'last_menu') return failDelete('last_menu');
    }
    throw err;
  }

  const nextMembership = ctx.memberships.find((m) => m.tenantId !== tenantId);
  const cookieStore = await cookies();
  if (nextMembership) {
    cookieStore.set(ACTIVE_TENANT_COOKIE, nextMembership.tenantId, activeTenantCookieOptions);
  } else {
    cookieStore.delete(ACTIVE_TENANT_COOKIE);
  }

  revalidateTag(`menu:${tenantId}`);
  revalidateTag(`tenant:${tenantId}`);
  revalidatePath('/', 'layout');

  return { ok: true as const, nextTenantId: nextMembership?.tenantId ?? null };
}
