'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getPrisma } from '@/lib/db/prisma';
import {
  checkTenantSlugAvailability,
  normalizeTenantSlug,
} from '@/server/services/slug.service';
import { normalizeWhatsAppPhone } from '@/lib/whatsapp';
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
  whatsappPhone: z
    .string()
    .max(24, 'Usa el formato +52XXXXXXXXXX')
    .transform((value) => normalizeWhatsAppPhone(value))
    .refine((value) => value === null || /^\+52\d{10}$/.test(value), {
      message: 'Usa el formato +52XXXXXXXXXX',
    }),
  businessHours: z
    .string()
    .max(120, 'Usa máximo 120 caracteres')
    .transform((value) => normalizeOptionalText(value)),
});

export async function updateBrandSettingsFormAction(formData: FormData) {
  const ctx = await requireAuth();
  const data = brandSettingsSchema.parse({
    slug: formData.get('slug')?.toString() ?? '',
    whatsappPhone: formData.get('whatsappPhone')?.toString() ?? '',
    businessHours: formData.get('businessHours')?.toString() ?? '',
  });

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
          whatsappPhone: data.whatsappPhone,
          businessHours: data.businessHours,
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
        whatsappPhone: data.whatsappPhone,
        businessHours: data.businessHours,
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

export const updateWhatsAppSettingsFormAction = updateBrandSettingsFormAction;
