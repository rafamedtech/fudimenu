'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getPrisma } from '@/lib/db/prisma';
import { normalizeWhatsAppPhone } from '@/lib/whatsapp';
import { requireAuth } from '@/server/guards/require-auth';

function normalizeOptionalText(input: string | null | undefined) {
  const trimmed = input?.trim();
  return trimmed ? trimmed : null;
}

const brandSettingsSchema = z.object({
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
    whatsappPhone: formData.get('whatsappPhone')?.toString() ?? '',
    businessHours: formData.get('businessHours')?.toString() ?? '',
  });

  const prisma = getPrisma();
  await prisma.tenant.update({
    where: { id: ctx.tenantId },
    data: {
      whatsappPhone: data.whatsappPhone,
      businessHours: data.businessHours,
    },
  });

  const activeMembership = ctx.memberships.find(
    (membership) => membership.tenantId === ctx.tenantId,
  );

  revalidatePath('/settings/brand');
  if (activeMembership) revalidatePath(`/m/${activeMembership.tenant.slug}`);

  redirect('/settings/brand?saved=1');
}

export const updateWhatsAppSettingsFormAction = updateBrandSettingsFormAction;
