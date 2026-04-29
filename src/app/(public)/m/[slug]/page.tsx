import { notFound } from 'next/navigation';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { menuService } from '@/server/services/menu.service';
import type { Metadata } from 'next';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: 'es' | 'en' }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await menuService.getTenantBySlug(slug);
  if (!tenant) return { title: 'Menú no encontrado' };
  return {
    title: `${tenant.name} — Menú`,
    description: `Menú digital de ${tenant.name}.`,
  };
}

export default async function PublicMenuPage({ params }: Props) {
  const { slug } = await params;
  const tenant = await menuService.getTenantBySlug(slug);
  if (!tenant) notFound();

  const { categories, items } = await menuService.getMenuByTenantId(tenant.id);

  const itemsByCategory = categories.map((cat) => ({
    category: cat,
    items: items.filter((i) => i.categoryId === cat.id),
  }));

  return (
    <main
      className="mx-auto min-h-dvh max-w-md bg-crema-50 pb-12"
      style={{ ['--brand' as string]: tenant.primaryColor }}
    >
      <header className="bg-white px-6 py-8 text-center shadow-sm">
        {tenant.logoUrl ? (
          <Image
            src={tenant.logoUrl}
            alt={tenant.name}
            width={80}
            height={80}
            className="mx-auto mb-3 rounded-full"
          />
        ) : (
          <div
            className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full text-3xl"
            style={{ backgroundColor: tenant.primaryColor + '33' }}
          >
            🍽️
          </div>
        )}
        <h1 className="text-2xl font-extrabold">{tenant.name}</h1>
      </header>

      <nav className="sticky top-0 z-10 flex gap-2 overflow-x-auto bg-crema-50/95 px-4 py-3 backdrop-blur">
        {categories.map((cat) => (
          <a
            key={cat.id}
            href={`#cat-${cat.id}`}
            className="whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-700 shadow-sm"
          >
            {cat.name}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-8 px-4 pt-4">
        {itemsByCategory.map(({ category, items: catItems }) => (
          <section key={category.id} id={`cat-${category.id}`}>
            <h2 className="mb-3 text-xl font-bold">{category.name}</h2>
            <div className="flex flex-col gap-3">
              {catItems.map((item) => (
                <article
                  key={item.id}
                  className="flex gap-3 rounded-lg bg-white p-3 shadow-sm"
                >
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-crema-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl">
                        🍽️
                      </div>
                    )}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-bold uppercase text-white">
                        Agotado
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <h3 className="font-semibold text-ink-900">{item.name}</h3>
                    {item.description && (
                      <p className="line-clamp-2 text-sm text-ink-500">{item.description}</p>
                    )}
                    <p className="mt-1 font-bold text-ink-900">
                      {formatPrice(item.priceCents, item.currency)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {tenant.plan === 'free' && (
        <footer className="mt-12 text-center text-xs text-ink-500">
          Hecho con <span className="font-bold text-mostaza-500">FudiMenu</span>
        </footer>
      )}
    </main>
  );
}
