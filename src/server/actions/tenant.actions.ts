'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getPrisma } from '@/lib/db/prisma';
import {
  checkTenantSlugAvailability,
  normalizeTenantSlug,
} from '@/server/services/slug.service';
import { requireAuth } from '@/server/guards/require-auth';

function normalizeOptionalText(input: string | null | undefined) {
  const trimmed = input?.trim();
  return trimmed ? trimmed : null;
}

const brandSettingsSchema = z.object({
  slug: z
    .string()
    .max(80, 'Usa maximo 80 caracteres')
    .transform((value) => normalizeTenantSlug(value))
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
  revalidatePath('/settings/brand');
  revalidatePath(`/m/${oldSlug}`);
  revalidatePath(`/m/${newSlug}`);

  redirect('/settings/brand?saved=1');
}
