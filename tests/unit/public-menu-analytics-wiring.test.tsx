/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import type React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicMenuTracker } from '@/components/public/public-menu-tracking';
import {
  PublicMenuIsland,
  type IslandGroup,
  type IslandStrings,
} from '@/app/(public)/m/[slug]/public-menu-island';
import type { MenuItem } from '@/types/domain';

const analytics = vi.hoisted(() => ({
  initAnalytics: vi.fn(),
  track: vi.fn(),
}));

vi.mock('@/lib/analytics/events', () => analytics);

const strings: IslandStrings = {
  searchPlaceholder: 'Search the menu',
  searchAria: 'Search the menu',
  searchClear: 'Clear search',
  searchEmpty: 'No matches',
  closeSheet: 'Close',
  sectionLabel: 'Section',
  special: 'Special',
  soldOut: 'Sold out',
  orderWhatsApp: 'Order on WhatsApp',
  viewDetail: 'View detail',
  dailySpecials: 'Daily specials',
  otherCategory: 'Other',
  allergenDisclaimer: 'Allergen and dietary information is managed by the restaurant.',
  containsAllergens: 'Contains',
  badges: {
    dietary: { vegan: 'Vegan', vegetarian: 'Vegetarian', gluten_free: 'Gluten-free', spicy: 'Spicy' },
    allergen: {
      dairy: 'Dairy',
      nuts: 'Nuts',
      peanuts: 'Peanuts',
      gluten: 'Gluten',
      shellfish: 'Shellfish',
      fish: 'Fish',
      eggs: 'Eggs',
      soy: 'Soy',
      sesame: 'Sesame',
    },
  },
};

const baseItem: MenuItem = {
  id: 'item-taco',
  tenantId: 'tenant-1',
  categoryId: 'cat-tacos',
  name: 'Taco de carne asada',
  description: 'Asada taco',
  priceCents: 4000,
  currency: 'MXN',
  imageUrl: null,
  isAvailable: true,
  dietaryTags: [],
  allergenTags: [],
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const secondItem: MenuItem = {
  ...baseItem,
  id: 'item-agua',
  categoryId: 'cat-bebidas',
  name: 'Agua fresca',
  description: 'Jamaica',
  priceCents: 4500,
};

const groups: IslandGroup[] = [
  {
    categoryId: 'cat-tacos',
    categoryName: 'Tacos',
    categoryCoverImageUrl: null,
    sectionId: null,
    sectionName: null,
    sectionAccent: null,
    sectionCoverImageUrl: null,
    items: [baseItem, secondItem],
  },
];

type MockIntersectionObserverInstance = {
  callback: IntersectionObserverCallback;
  observe: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  trigger: (target: Element, isIntersecting?: boolean) => void;
};

const intersectionObservers: MockIntersectionObserverInstance[] = [];

function installDomMocks() {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-09T12:00:00.000Z'));

  Object.defineProperty(window.navigator, 'sendBeacon', {
    configurable: true,
    value: vi.fn(() => true),
  });
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    value:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
  });
  vi.stubGlobal('fetch', vi.fn());
  vi.stubGlobal('crypto', { randomUUID: () => 'session-123' });

  class MockIntersectionObserver {
    callback: IntersectionObserverCallback;
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
      intersectionObservers.push(this);
    }

    trigger(target: Element, isIntersecting = true) {
      this.callback([{ target, isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

  HTMLDialogElement.prototype.showModal = vi.fn(function showModal(this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) {
    this.open = false;
  });
  HTMLDialogElement.prototype.getAnimations = vi.fn(() => []);
  Element.prototype.animate = vi.fn(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    cancel: vi.fn(),
  })) as unknown as typeof Element.prototype.animate;

  window.history.replaceState(null, '', '/m/taqueria-rafa?utm_source=QR&utm_campaign=Table-7');
}

async function render(ui: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(ui);
  });
  return { container, root };
}

async function unmount(root: Root) {
  await act(async () => {
    root.unmount();
  });
}

async function changeInput(input: HTMLInputElement, value: string) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function click(element: Element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

beforeEach(() => {
  installDomMocks();
  window.localStorage.clear();
  window.sessionStorage.clear();
  document.body.innerHTML = '';
  intersectionObservers.length = 0;
  analytics.initAnalytics.mockClear();
  analytics.track.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('PublicMenuTracker analytics wiring', () => {
  it('tracks menu view, visible item, sendBeacon view record, and delegated WhatsApp click', async () => {
    document.body.innerHTML = `
      <button data-item-id="item-visible" data-item-category="Tacos">Taco</button>
      <a data-track-wa="item-visible" href="https://wa.me/521234">Order</a>
    `;

    const { root } = await render(
      <PublicMenuTracker tenantId="tenant-1" slug="taqueria-rafa" locale="en" />,
    );

    expect(analytics.initAnalytics).toHaveBeenCalledTimes(1);
    expect(analytics.track).toHaveBeenCalledWith('menu_viewed', {
      tenantId: 'tenant-1',
      source: 'qr',
      campaign: 'table-7',
      utm_source: 'qr',
      utm_campaign: 'table-7',
    });
    expect(window.navigator.sendBeacon).toHaveBeenCalledTimes(1);
    expect(window.navigator.sendBeacon).toHaveBeenCalledWith(
      '/api/track/view',
      expect.any(Blob),
    );

    const item = document.querySelector('[data-item-id="item-visible"]');
    expect(item).not.toBeNull();
    expect(intersectionObservers).toHaveLength(1);

    intersectionObservers[0].trigger(item!);
    expect(analytics.track).toHaveBeenCalledWith('item_viewed', {
      itemId: 'item-visible',
      category: 'Tacos',
      source: 'qr',
      campaign: 'table-7',
      utm_source: 'qr',
      utm_campaign: 'table-7',
    });
    expect(intersectionObservers[0].unobserve).toHaveBeenCalledWith(item);

    await click(document.querySelector('[data-track-wa="item-visible"]')!);
    expect(analytics.track).toHaveBeenCalledWith('whatsapp_clicked', {
      tenantId: 'tenant-1',
      itemId: 'item-visible',
      locale: 'en',
      device: 'desktop',
      source: 'qr',
      campaign: 'table-7',
      utm_source: 'qr',
      utm_campaign: 'table-7',
    });

    await unmount(root);
    expect(intersectionObservers[0].disconnect).toHaveBeenCalledTimes(1);
  });
});

describe('PublicMenuIsland analytics wiring', () => {
  it('debounces search tracking and tracks item detail from real DOM interaction', async () => {
    const { root, container } = await render(
      <PublicMenuIsland
        slug="taqueria-rafa"
        tenantId="tenant-1"
        tenantName="Taqueria Rafa"
        whatsappPhone="+521234567890"
        priceLocale="es-MX"
        locale="en"
        dailySpecials={[]}
        groups={groups}
        strings={strings}
      />,
    );

    const search = container.querySelector('input[type="search"]') as HTMLInputElement;
    expect(search).not.toBeNull();

    await changeInput(search, 'taco');
    await act(async () => {
      vi.advanceTimersByTime(699);
    });
    expect(analytics.track).not.toHaveBeenCalledWith('menu_search', expect.anything());

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(analytics.track).toHaveBeenCalledWith('menu_search', {
      tenantId: 'tenant-1',
      query: 'taco',
      resultCount: 1,
      source: 'qr',
      campaign: 'table-7',
      utm_source: 'qr',
      utm_campaign: 'table-7',
    });

    await changeInput(search, 'zzznomatch');
    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    expect(analytics.track).toHaveBeenCalledWith('menu_search', {
      tenantId: 'tenant-1',
      query: 'zzznomatch',
      resultCount: 0,
      source: 'qr',
      campaign: 'table-7',
      utm_source: 'qr',
      utm_campaign: 'table-7',
    });

    await click(container.querySelector('button[aria-label="Clear search"]')!);
    await click(container.querySelector('button[data-item-id="item-taco"]')!);

    expect(analytics.track).toHaveBeenCalledWith('item_detail_viewed', {
      tenantId: 'tenant-1',
      itemId: 'item-taco',
      category: 'Tacos',
      source: 'qr',
      campaign: 'table-7',
      utm_source: 'qr',
      utm_campaign: 'table-7',
    });
    expect(container.querySelector('a[data-track-wa="item-taco"]')).not.toBeNull();

    await unmount(root);
  });
});
