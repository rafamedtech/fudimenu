'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getPrisma } from '@/lib/db/prisma';
import { isValidWhatsAppPhone, normalizeWhatsAppPhone } from '@/lib/whatsapp';
import { isValidTimeZone } from '@/lib/validators/schedule.schema';
import { requireAuth } from '@/server/guards/require-auth';

function normalizeOptionalText(input: string | null | undefined) {
  const trimmed = input?.trim();
  return trimmed ? trimmed : null;
}

const contactSettingsSchema = z.object({
  whatsappPhone: z
    .string()
    .max(24, 'Usa formato internacional E.164')
    .transform((value) => normalizeWhatsAppPhone(value))
    .refine((value) => value === null || isValidWhatsAppPhone(value), {
      message: 'Usa formato internacional E.164',
    }),
  businessHours: z
    .string()
    .max(120, 'Usa maximo 120 caracteres')
    .transform((value) => normalizeOptionalText(value)),
  // Timezone for visibility scheduling. Empty → null (code default applies).
  timezone: z
    .string()
    .max(64)
    .transform((value) => normalizeOptionalText(value))
    .refine((value) => value === null || isValidTimeZone(value), {
      message: 'Zona horaria inválida',
    }),
});

export async function updateContactSettingsFormAction(formData: FormData) {
  const ctx = await requireAuth();
  const data = contactSettingsSchema.parse({
    whatsappPhone: formData.get('whatsappPhone')?.toString() ?? '',
    businessHours: formData.get('businessHours')?.toString() ?? '',
    timezone: formData.get('timezone')?.toString() ?? '',
  });

  if (process.env.USE_MOCKS === 'true') {
    redirect('/settings/contact?saved=1');
  }

  const prisma = getPrisma();
  const tenant = await prisma.tenant.update({
    where: { id: ctx.tenantId },
    data: {
      whatsappPhone: data.whatsappPhone,
      businessHours: data.businessHours,
      timezone: data.timezone,
    },
    select: { slug: true },
  });

  revalidateTag(`menu:${ctx.tenantId}`);
  revalidateTag(`tenant:${ctx.tenantId}`);
  revalidateTag(`tenant-slug:${tenant.slug}`);
  revalidatePath('/settings/contact');
  revalidatePath(`/m/${tenant.slug}`);

  redirect('/settings/contact?saved=1');
}
