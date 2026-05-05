import { describe, expect, it, vi } from 'vitest';
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppOrderUrl,
  normalizeWhatsAppPhone,
  isValidWhatsAppPhone,
} from '../../src/lib/whatsapp';

describe('whatsapp helpers', () => {
  it('normalizes formatted phone numbers', () => {
    expect(normalizeWhatsAppPhone('+52 (664) 123-4567')).toBe('+526641234567');
  });

  it('validates the Mexican international WhatsApp format', () => {
    expect(isValidWhatsAppPhone('+526641234567')).toBe(true);
    expect(isValidWhatsAppPhone('6641234567')).toBe(false);
    expect(isValidWhatsAppPhone('+15551234567')).toBe(false);
  });

  it('builds the MVP order message', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://staging.fudimenu.test/');

    expect(
      buildWhatsAppOrderMessage({
        slug: 'taqueria-don-pepe',
        itemName: 'Tacos al pastor',
      }),
    ).toBe(
      'Hola! Vi tu menú en https://staging.fudimenu.test/m/taqueria-don-pepe y quiero pedir:\n- Tacos al pastor x1\n¿Tienen disponibilidad?',
    );
  });

  it('builds wa.me urls with a valid Mexican WhatsApp phone', () => {
    const url = buildWhatsAppOrderUrl({
      phone: '+526641234567',
      slug: 'taqueria-don-pepe',
      itemName: 'Tacos al pastor',
    });

    expect(url).toContain('https://wa.me/526641234567?text=');
  });

  it('returns null when the tenant has no valid WhatsApp number', () => {
    expect(
      buildWhatsAppOrderUrl({
        phone: '+15551234567',
        slug: 'taqueria-don-pepe',
        itemName: 'Tacos al pastor',
      }),
    ).toBeNull();
  });
});
