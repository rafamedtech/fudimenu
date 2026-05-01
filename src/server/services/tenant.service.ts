import 'server-only';
import { getPrisma } from '@/lib/db/prisma';
import { slugify } from '@/lib/utils';
import { billingService } from '@/server/services/billing.service';

const DEFAULT_CATEGORY_NAME = 'Otros';

const categoryPresets: Record<string, string[]> = {
  mexicana: ['Tacos', 'Bebidas', 'Postres', DEFAULT_CATEGORY_NAME],
  pizza: ['Pizzas', 'Pastas', 'Bebidas', DEFAULT_CATEGORY_NAME],
  burgers: ['Hamburguesas', 'Acompañamientos', 'Bebidas', DEFAULT_CATEGORY_NAME],
  cafe: ['Cafés', 'Alimentos', 'Postres', DEFAULT_CATEGORY_NAME],
  sushi: ['Rollos', 'Nigiris', 'Bebidas', DEFAULT_CATEGORY_NAME],
  saludable: ['Bowls', 'Ensaladas', 'Jugos', DEFAULT_CATEGORY_NAME],
};

type CompleteOnboardingTenantInput = {
  userId: string;
  email: string;
  name: string;
  cuisine: string;
  itemName: string;
  priceCents: number;
};

function getStarterCategories(cuisine: string) {
  const categoryNames = categoryPresets[cuisine] ?? ['Menú', 'Bebidas', 'Especiales', DEFAULT_CATEGORY_NAME];

  return categoryNames.map((name, index) => ({
    name,
    sortOrder: index,
  }));
}

export const tenantService = {
  async createFromOnboarding(input: CompleteOnboardingTenantInput) {
    const prisma = getPrisma();
    const tenantId = crypto.randomUUID();
    const slug = `${slugify(input.name) || 'restaurante'}-${tenantId.slice(0, 8)}`;
    const starterCategories = getStarterCategories(input.cuisine);

    await prisma.$transaction(async (tx) => {
      await tx.tenant.create({
        data: {
          id: tenantId,
          createdBy: input.userId,
          slug,
          name: input.name,
          cuisineType: input.cuisine,
          currency: 'MXN',
          defaultLocale: 'es',
          plan: 'pro',
        },
      });

      await tx.membership.create({
        data: {
          tenantId,
          userId: input.userId,
          role: 'owner',
        },
      });

      const categories = await Promise.all(
        starterCategories.map((category) =>
          tx.category.create({
            data: {
              tenantId,
              name: category.name,
              sortOrder: category.sortOrder,
            },
            select: { id: true },
          }),
        ),
      );

      await tx.menuItem.create({
        data: {
          tenantId,
          categoryId: categories[0]?.id ?? null,
          name: input.itemName,
          priceCents: input.priceCents,
          currency: 'MXN',
          isAvailable: true,
          sortOrder: 0,
        },
      });
    });

    await billingService.startProTrialForTenant({
      tenantId,
      tenantName: input.name,
      tenantSlug: slug,
      userId: input.userId,
      email: input.email,
    });

    return { tenantId, slug };
  },
};
