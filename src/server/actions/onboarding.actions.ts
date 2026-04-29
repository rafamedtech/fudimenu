'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getPrisma } from '@/lib/db/prisma';
import { createSupabaseServer } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
import { mockTenant } from '@/lib/mock/data';

const onboardingSchema = z.object({
  name: z.string().min(1).max(80),
  cuisine: z.string().min(1).max(40),
  itemName: z.string().min(1).max(80),
  priceCents: z.number().int().min(1).max(10_000_00),
});

const categoryPresets: Record<string, string[]> = {
  mexicana: ['Tacos', 'Bebidas', 'Postres'],
  pizza: ['Pizzas', 'Entradas', 'Bebidas'],
  burgers: ['Hamburguesas', 'Acompañamientos', 'Bebidas'],
  cafe: ['Café', 'Panadería', 'Bebidas frías'],
  sushi: ['Rollos', 'Entradas', 'Bebidas'],
  saludable: ['Bowls', 'Ensaladas', 'Bebidas'],
};

export async function completeOnboardingAction(input: unknown) {
  const data = onboardingSchema.parse(input);

  if (process.env.USE_MOCKS === 'true') {
    return { ok: true as const, tenantId: mockTenant.id, slug: mockTenant.slug };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const prisma = getPrisma();
  const existingMembership = await prisma.membership.findFirst({
    where: { userId: user.id },
    select: { tenantId: true },
  });

  if (existingMembership) {
    return { ok: true as const, tenantId: existingMembership.tenantId, slug: null };
  }

  const tenantId = crypto.randomUUID();
  const slug = `${slugify(data.name) || 'restaurante'}-${tenantId.slice(0, 8)}`;
  const categoryNames = categoryPresets[data.cuisine] ?? ['Menú', 'Bebidas', 'Especiales'];

  await prisma.$transaction(async (tx) => {
    await tx.tenant.create({
      data: {
        id: tenantId,
        createdBy: user.id,
        slug,
        name: data.name,
        cuisineType: data.cuisine,
        currency: 'MXN',
        defaultLocale: 'es',
        plan: 'free',
      },
    });

    await tx.membership.create({
      data: {
        tenantId,
        userId: user.id,
        role: 'owner',
      },
    });

    const categories = await Promise.all(
      categoryNames.map((name, sortOrder) =>
        tx.category.create({
          data: {
            tenantId,
            name,
            sortOrder,
          },
          select: { id: true },
        }),
      ),
    );

    await tx.menuItem.create({
      data: {
        tenantId,
        categoryId: categories[0]?.id ?? null,
        name: data.itemName,
        priceCents: data.priceCents,
        currency: 'MXN',
        isAvailable: true,
        sortOrder: 0,
      },
    });
  });

  return { ok: true as const, tenantId, slug };
}
