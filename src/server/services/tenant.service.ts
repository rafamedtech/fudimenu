import 'server-only';
import { getPrisma } from '@/lib/db/prisma';
import { sanitizePlainText } from '@/lib/sanitize';
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

const fallbackPlaceholderItems = [
  { name: 'Platillo de la casa', priceCents: 12000 },
  { name: 'Especial del dia', priceCents: 10000 },
  { name: 'Entrada para compartir', priceCents: 8000 },
  { name: 'Bebida natural', priceCents: 4500 },
  { name: 'Postre de la casa', priceCents: 6500 },
  { name: 'Combo individual', priceCents: 15000 },
];

const placeholderItemsByCuisine: Record<string, Array<{ name: string; priceCents: number }>> = {
  mexicana: [
    { name: 'Tacos al pastor', priceCents: 12000 },
    { name: 'Quesadillas', priceCents: 9000 },
    { name: 'Tortas', priceCents: 8500 },
    { name: 'Aguas frescas', priceCents: 4500 },
    { name: 'Flan de la casa', priceCents: 6500 },
    { name: 'Arroz con leche', priceCents: 5000 },
  ],
  pizza: [
    { name: 'Pizza margarita', priceCents: 14000 },
    { name: 'Pizza pepperoni', priceCents: 16000 },
    { name: 'Pizza hawaiana', priceCents: 15500 },
    { name: 'Pasta al pomodoro', priceCents: 12000 },
    { name: 'Refresco italiano', priceCents: 5000 },
    { name: 'Tiramisu', priceCents: 7500 },
  ],
  burgers: [
    { name: 'Hamburguesa clasica', priceCents: 13000 },
    { name: 'Cheeseburger', priceCents: 14500 },
    { name: 'Papas a la francesa', priceCents: 6500 },
    { name: 'Aros de cebolla', priceCents: 7000 },
    { name: 'Malteada de vainilla', priceCents: 8000 },
    { name: 'Brownie', priceCents: 6500 },
  ],
  cafe: [
    { name: 'Americano', priceCents: 4500 },
    { name: 'Latte', priceCents: 6000 },
    { name: 'Capuchino', priceCents: 6000 },
    { name: 'Croissant', priceCents: 5500 },
    { name: 'Pan dulce', priceCents: 4000 },
    { name: 'Cheesecake', priceCents: 7500 },
  ],
  sushi: [
    { name: 'California roll', priceCents: 14000 },
    { name: 'Spicy tuna roll', priceCents: 16000 },
    { name: 'Nigiri de salmon', priceCents: 12000 },
    { name: 'Edamames', priceCents: 7000 },
    { name: 'Te helado', priceCents: 5000 },
    { name: 'Mochi', priceCents: 6500 },
  ],
  saludable: [
    { name: 'Bowl de quinoa', priceCents: 13500 },
    { name: 'Ensalada cesar', priceCents: 12000 },
    { name: 'Wrap de pollo', priceCents: 11000 },
    { name: 'Jugo verde', priceCents: 6500 },
    { name: 'Smoothie de frutos rojos', priceCents: 8500 },
    { name: 'Yogurt con granola', priceCents: 7500 },
  ],
};

type CompleteOnboardingTenantInput = {
  userId: string;
  email: string;
  name: string;
  cuisine: string;
  itemName?: string;
  priceCents?: number;
};

function getStarterCategories(cuisine: string) {
  const categoryNames = categoryPresets[cuisine] ?? ['Menú', 'Bebidas', 'Especiales', DEFAULT_CATEGORY_NAME];

  return categoryNames.map((name, index) => ({
    name,
    sortOrder: index,
  }));
}

function getPlaceholderItems(cuisine: string) {
  return placeholderItemsByCuisine[cuisine] ?? fallbackPlaceholderItems;
}

function getStarterMenuItems(input: CompleteOnboardingTenantInput) {
  const placeholders = getPlaceholderItems(input.cuisine);
  const firstItem =
    input.itemName && input.priceCents
      ? { name: input.itemName, priceCents: input.priceCents }
      : null;

  if (!firstItem) return placeholders;

  const normalizedFirstItemName = firstItem.name.trim().toLocaleLowerCase('es-MX');
  const remainingPlaceholders = placeholders.filter(
    (item) => item.name.trim().toLocaleLowerCase('es-MX') !== normalizedFirstItemName,
  );

  return [firstItem, ...remainingPlaceholders].slice(0, 6);
}

export const tenantService = {
  async createFromOnboarding(input: CompleteOnboardingTenantInput) {
    const tenantName = sanitizePlainText(input.name, 80) ?? 'Sin nombre';
    const itemName = sanitizePlainText(input.itemName, 80) ?? undefined;
    const sanitizedInput = { ...input, name: tenantName, itemName };
    const prisma = getPrisma();
    const tenantId = crypto.randomUUID();
    const slug = `${slugify(tenantName) || 'restaurante'}-${tenantId.slice(0, 8)}`;
    const starterCategories = getStarterCategories(sanitizedInput.cuisine);
    const starterMenuItems = getStarterMenuItems(sanitizedInput);

    await prisma.$transaction(async (tx) => {
      await tx.tenant.create({
        data: {
          id: tenantId,
          createdBy: input.userId,
          slug,
          name: tenantName,
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

      const section = await tx.menuSection.create({
        data: { tenantId, name: 'Menú', sortOrder: 0 },
        select: { id: true },
      });

      const categories = await Promise.all(
        starterCategories.map((category) =>
          tx.category.create({
            data: {
              tenantId,
              sectionId: section.id,
              name: category.name,
              sortOrder: category.sortOrder,
            },
            select: { id: true },
          }),
        ),
      );

      await Promise.all(
        starterMenuItems.map((item, index) =>
          tx.menuItem.create({
            data: {
              tenantId,
              categoryId: categories[index % categories.length]?.id ?? null,
              name: item.name,
              priceCents: item.priceCents,
              currency: 'MXN',
              isAvailable: true,
              sortOrder: index,
            },
          }),
        ),
      );
    });

    await billingService.startProTrialForTenant({
      tenantId,
      tenantName,
      tenantSlug: slug,
      userId: input.userId,
      email: input.email,
    });

    return { tenantId, slug };
  },

  async softDeleteTenant(tenantId: string, userId: string) {
    const prisma = getPrisma();
    const membership = await prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      select: { role: true, deletedAt: true },
    });
    if (!membership || membership.deletedAt || membership.role !== 'owner') {
      throw new Error('forbidden');
    }

    const activeCount = await prisma.membership.count({
      where: { userId, deletedAt: null, tenant: { deletedAt: null } },
    });
    if (activeCount <= 1) throw new Error('last_menu');

    const now = new Date();
    await prisma.$transaction([
      prisma.tenant.update({ where: { id: tenantId }, data: { deletedAt: now } }),
      prisma.membership.updateMany({ where: { tenantId }, data: { deletedAt: now } }),
    ]);
  },
};
