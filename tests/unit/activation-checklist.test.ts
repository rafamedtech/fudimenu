import { describe, expect, it } from 'vitest';
import { buildActivationChecklist } from '@/lib/activation-checklist';
import type { Category, MenuItem, MenuSection, Tenant } from '@/types/domain';

function tenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 'tenant-1',
    slug: 'taqueria-demo',
    name: 'Taqueria Demo',
    logoUrl: 'https://cdn.test/logo.png',
    coverImageUrl: 'https://cdn.test/cover.jpg',
    logoShape: 'round',
    whatsappPhone: '+526641234567',
    businessHours: null,
    primaryColor: '#F4B400',
    cuisineType: 'mexicana',
    defaultLocale: 'es',
    currency: 'MXN',
    plan: 'free',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function item(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: crypto.randomUUID(),
    tenantId: 'tenant-1',
    categoryId: null,
    name: 'Tacos al pastor',
    description: null,
    priceCents: 12000,
    currency: 'MXN',
    imageUrl: 'https://cdn.test/item.jpg',
    isAvailable: true,
    dietaryTags: [],
    allergenTags: [],
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function section(overrides: Partial<MenuSection> = {}): MenuSection {
  return {
    id: 'section-1',
    tenantId: 'tenant-1',
    name: 'Menu',
    coverImageUrl: null,
    accentColor: '#F4B400',
    sortOrder: 0,
    isVisible: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function category(overrides: Partial<Category> = {}): Category {
  return {
    id: 'category-1',
    tenantId: 'tenant-1',
    sectionId: 'section-1',
    name: 'Tacos',
    coverImageUrl: null,
    sortOrder: 0,
    isVisible: true,
    ...overrides,
  };
}

describe('buildActivationChecklist', () => {
  it('marks all public activation items complete from tenant and menu data', () => {
    const checklist = buildActivationChecklist({
      tenant: tenant(),
      qrDownloadedAt: '2026-06-06T20:00:00.000Z',
      items: [
        item({ id: 'item-1', isSpecialToday: true }),
        item({ id: 'item-2' }),
        item({ id: 'item-3' }),
      ],
    });

    expect(checklist.completedCount).toBe(6);
    expect(checklist.percent).toBe(100);
    expect(checklist.nextItem).toBeNull();
  });

  it('surfaces missing brand, contact, photos, and daily special work', () => {
    const checklist = buildActivationChecklist({
      tenant: tenant({
        logoUrl: null,
        coverImageUrl: null,
        whatsappPhone: '6641234567',
      }),
      qrDownloadedAt: null,
      items: [
        item({ id: 'item-1', imageUrl: null }),
        item({ id: 'item-2', imageUrl: null }),
      ],
    });

    expect(checklist.completedCount).toBe(0);
    expect(checklist.percent).toBe(0);
    expect(checklist.nextItem?.id).toBe('logo');
    expect(checklist.items.filter((entry) => !entry.completed).map((entry) => entry.id)).toEqual([
      'logo',
      'cover',
      'whatsapp',
      'item-photos',
      'qr',
      'daily-special',
    ]);
  });

  it('accepts visible section and category covers as menu cover evidence', () => {
    expect(
      buildActivationChecklist({
        tenant: tenant({ coverImageUrl: null }),
        qrDownloadedAt: '2026-06-06T20:00:00.000Z',
        items: [item({ isSpecialToday: true })],
        sections: [section({ coverImageUrl: 'https://cdn.test/section.jpg' })],
      }).items.find((entry) => entry.id === 'cover')?.completed,
    ).toBe(true);

    expect(
      buildActivationChecklist({
        tenant: tenant({ coverImageUrl: null }),
        qrDownloadedAt: '2026-06-06T20:00:00.000Z',
        items: [item({ isSpecialToday: true })],
        categories: [category({ coverImageUrl: 'https://cdn.test/category.jpg' })],
      }).items.find((entry) => entry.id === 'cover')?.completed,
    ).toBe(true);
  });

  it('requires photos on up to three available public items', () => {
    const checklist = buildActivationChecklist({
      tenant: tenant(),
      qrDownloadedAt: '2026-06-06T20:00:00.000Z',
      items: [
        item({ id: 'item-1', imageUrl: 'https://cdn.test/1.jpg' }),
        item({ id: 'item-2', imageUrl: 'https://cdn.test/2.jpg' }),
        item({ id: 'item-3', imageUrl: null }),
        item({ id: 'item-4', imageUrl: 'https://cdn.test/4.jpg', isAvailable: false }),
      ],
    });

    const photoItem = checklist.items.find((entry) => entry.id === 'item-photos');
    expect(photoItem?.completed).toBe(false);
    expect(photoItem?.metric).toBe('2/3 fotos clave');
  });

  it('marks QR complete only when there is download evidence', () => {
    const baseInput = {
      tenant: tenant(),
      items: [
        item({ id: 'item-1', isSpecialToday: true }),
        item({ id: 'item-2' }),
        item({ id: 'item-3' }),
      ],
    };

    expect(
      buildActivationChecklist({ ...baseInput, qrDownloadedAt: null }).items.find(
        (entry) => entry.id === 'qr',
      )?.completed,
    ).toBe(false);
    expect(
      buildActivationChecklist({
        ...baseInput,
        qrDownloadedAt: '2026-06-06T20:00:00.000Z',
      }).items.find((entry) => entry.id === 'qr')?.completed,
    ).toBe(true);
  });
});
