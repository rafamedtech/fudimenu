import { isValidWhatsAppPhone } from '@/lib/whatsapp';
import type { Category, MenuItem, MenuSection, Tenant } from '@/types/domain';

export type ActivationChecklistItemId =
  | 'logo'
  | 'cover'
  | 'whatsapp'
  | 'item-photos'
  | 'qr'
  | 'daily-special';

export type ActivationChecklistItem = {
  id: ActivationChecklistItemId;
  title: string;
  description: string;
  href: string;
  completed: boolean;
  metric?: string;
};

export type ActivationChecklist = {
  items: ActivationChecklistItem[];
  completedCount: number;
  totalCount: number;
  percent: number;
  nextItem: ActivationChecklistItem | null;
};

type ActivationChecklistInput = {
  tenant: Pick<Tenant, 'logoUrl' | 'coverImageUrl' | 'whatsappPhone' | 'slug'>;
  qrDownloadedAt: string | null;
  items: Pick<MenuItem, 'imageUrl' | 'isAvailable' | 'isSpecialToday' | 'deletedAt'>[];
  sections?: Pick<MenuSection, 'coverImageUrl' | 'isVisible' | 'deletedAt'>[];
  categories?: Pick<Category, 'coverImageUrl' | 'isVisible'>[];
};

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function getVisibleMenuItems(items: ActivationChecklistInput['items']) {
  return items.filter((item) => item.deletedAt == null && item.isAvailable);
}

function getCoverImage(input: ActivationChecklistInput) {
  if (hasValue(input.tenant.coverImageUrl)) return input.tenant.coverImageUrl;
  if (
    input.sections?.some(
      (section) => section.deletedAt == null && section.isVisible && hasValue(section.coverImageUrl),
    )
  ) {
    return 'section-cover';
  }
  if (input.categories?.some((category) => category.isVisible && hasValue(category.coverImageUrl))) {
    return 'category-cover';
  }
  return null;
}

export function buildActivationChecklist(input: ActivationChecklistInput): ActivationChecklist {
  const visibleItems = getVisibleMenuItems(input.items);
  const photographedItems = visibleItems.filter((item) => hasValue(item.imageUrl));
  const targetPhotoCount = Math.min(3, visibleItems.length);
  const hasPhotoCoverage = targetPhotoCount > 0 && photographedItems.length >= targetPhotoCount;
  const hasDailySpecial = visibleItems.some((item) => item.isSpecialToday);

  const items: ActivationChecklistItem[] = [
    {
      id: 'logo',
      title: 'Logo del restaurante',
      description: 'Hace que el menú público se reconozca al abrirlo y al compartirlo.',
      href: '/settings/brand',
      completed: hasValue(input.tenant.logoUrl),
    },
    {
      id: 'cover',
      title: 'Portada del menú',
      description: 'Dale contexto visual a la primera impresión del menú público.',
      href: '/settings/brand',
      completed: getCoverImage(input) !== null,
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp visible',
      description: 'Permite que los comensales contacten al restaurante desde el menú.',
      href: '/settings/contact',
      completed: isValidWhatsAppPhone(input.tenant.whatsappPhone),
    },
    {
      id: 'item-photos',
      title: 'Platillos con foto',
      description: 'Completa fotos en tus platillos principales para que el menú venda mejor.',
      href: '/menu',
      completed: hasPhotoCoverage,
      metric:
        visibleItems.length === 0
          ? '0 platillos'
          : `${photographedItems.length}/${targetPhotoCount} fotos clave`,
    },
    {
      id: 'qr',
      title: 'QR descargado',
      description: 'Descarga el QR para imprimirlo o compartirlo donde tus clientes lo escanean.',
      href: '/qr',
      completed: input.qrDownloadedAt !== null,
    },
    {
      id: 'daily-special',
      title: 'Especial del día',
      description: 'Destaca un platillo en la vista pública para empujarlo hoy.',
      href: '/menu',
      completed: hasDailySpecial,
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;

  return {
    items,
    completedCount,
    totalCount,
    percent: Math.round((completedCount / totalCount) * 100),
    nextItem: items.find((item) => !item.completed) ?? null,
  };
}
