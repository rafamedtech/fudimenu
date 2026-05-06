import { describe, expect, it, vi } from 'vitest';
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppOrderUrl,
  detectCountryCode,
  normalizeWhatsAppPhone,
  isValidWhatsAppPhone,
} from '../../src/lib/whatsapp';

describe('whatsapp helpers', () => {
  it('normalizes formatted phone numbers', () => {
    expect(normalizeWhatsAppPhone('+52 (664) 123-4567')).toBe('+526641234567');
  });

  it('validates E.164 international WhatsApp numbers', () => {
    expect(isValidWhatsAppPhone('+524444444444')).toBe(true);
    expect(isValidWhatsAppPhone('+13234567890')).toBe(true);
    expect(isValidWhatsAppPhone('+5712345678')).toBe(true);
  });

  it('rejects numbers without E.164 format', () => {
    expect(isValidWhatsAppPhone('1234567890')).toBe(false);
    expect(isValidWhatsAppPhone('+0123456789')).toBe(false);
  });

  it('detects known country codes', () => {
    expect(detectCountryCode('+524444444444')).toBe('MX');
    expect(detectCountryCode('+13234567890')).toBe('US');
    expect(detectCountryCode('+5712345678')).toBe('CO');
    expect(detectCountryCode('+51987654321')).toBe('PE');
    expect(detectCountryCode('+441234567890')).toBeNull();
    expect(detectCountryCode(null)).toBeNull();
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

  it('builds wa.me urls with a valid WhatsApp phone', () => {
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
        phone: '6641234567',
        slug: 'taqueria-don-pepe',
        itemName: 'Tacos al pastor',
      }),
    ).toBeNull();
  });
});
