import 'server-only';
import { getPrisma } from '@/lib/db/prisma';
import { slugify } from '@/lib/utils';

const DEFAULT_CATEGORY_NAME = 'Otros';
const DEFAULT_CATEGORY_SORT_ORDER = 999;

const categoryPresets: Record<string, string[]> = {
  mexicana: ['Tacos', 'Bebidas', 'Postres'],
  pizza: ['Pizzas', 'Entradas', 'Bebidas'],
  burgers: ['Hamburguesas', 'Acompañamientos', 'Bebidas'],
  cafe: ['Café', 'Panadería', 'Bebidas frías'],
  sushi: ['Rollos', 'Entradas', 'Bebidas'],
  saludable: ['Bowls', 'Ensaladas', 'Bebidas'],
};

type CompleteOnboardingTenantInput = {
  userId: string;
  name: string;
  cuisine: string;
  itemName: string;
  priceCents: number;
};

function getStarterCategories(cuisine: string) {
  const names = categoryPresets[cuisine] ?? ['Menú', 'Bebidas', 'Especiales'];
  const categoryNames = names.includes(DEFAULT_CATEGORY_NAME)
    ? names
    : [...names, DEFAULT_CATEGORY_NAME];

  return categoryNames.map((name, index) => ({
    name,
    sortOrder: name === DEFAULT_CATEGORY_NAME ? DEFAULT_CATEGORY_SORT_ORDER : index,
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
          plan: 'free',
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

    return { tenantId, slug };
  },
};
