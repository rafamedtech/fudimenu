'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getPrisma } from '@/lib/db/prisma';
import { normalizeWhatsAppPhone } from '@/lib/whatsapp';
import { requireAuth } from '@/server/guards/require-auth';

const whatsappSettingsSchema = z.object({
  whatsappPhone: z
    .string()
    .max(24, 'Usa el formato +52XXXXXXXXXX')
    .transform((value) => normalizeWhatsAppPhone(value))
    .refine((value) => value === null || /^\+52\d{10}$/.test(value), {
      message: 'Usa el formato +52XXXXXXXXXX',
    }),
});

export async function updateWhatsAppSettingsFormAction(formData: FormData) {
  const ctx = await requireAuth();
  const data = whatsappSettingsSchema.parse({
    whatsappPhone: formData.get('whatsappPhone')?.toString() ?? '',
  });

  const prisma = getPrisma();
  await prisma.tenant.update({
    where: { id: ctx.tenantId },
    data: {
      whatsappPhone: data.whatsappPhone,
    },
  });

  const activeMembership = ctx.memberships.find(
    (membership) => membership.tenantId === ctx.tenantId,
  );

  revalidatePath('/settings/contact');
  if (activeMembership) revalidatePath(`/m/${activeMembership.tenant.slug}`);

  redirect('/settings/contact?saved=1');
}
