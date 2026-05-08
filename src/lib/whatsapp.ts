const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

export function normalizeWhatsAppPhone(input: string | null | undefined) {
  if (!input) return null;

  const trimmed = input.trim().replace(/[\s\-()]/g, '');
  if (!trimmed.startsWith('+')) return null;

  const digits = `+${trimmed.slice(1).replace(/\D/g, '')}`;
  return digits.length > 1 ? digits : null;
}

export function isValidWhatsAppPhone(input: string | null | undefined) {
  const phone = normalizeWhatsAppPhone(input);
  return phone !== null && E164_PATTERN.test(phone);
}

export function detectCountryCode(phone: string | null) {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return null;
  if (normalized.startsWith('+52')) return 'MX';
  if (normalized.startsWith('+57')) return 'CO';
  if (normalized.startsWith('+51')) return 'PE';
  if (normalized.startsWith('+1')) return 'US';
  return null;
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://fudimenu.app';
}

export function buildWhatsAppOrderMessage(input: {
  slug: string;
  itemName: string;
  quantity?: number;
  locale?: 'es' | 'en';
  restaurantName?: string;
  price?: string;
}) {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const menuUrl = `${baseUrl}/m/${input.slug}`;
  const qty = input.quantity ?? 1;
  const itemLine = input.price
    ? `- ${input.itemName} x${qty} — ${input.price}`
    : `- ${input.itemName} x${qty}`;

  if (input.locale === 'en') {
    const intro = input.restaurantName
      ? `Hi! I saw ${input.restaurantName}'s menu at ${menuUrl} and I want to order:`
      : `Hi! I saw your menu at ${menuUrl} and I want to order:`;
    return [intro, itemLine, 'Is it available?'].join('\n');
  }

  const intro = input.restaurantName
    ? `Hola! Vi el menú de ${input.restaurantName} en ${menuUrl} y quiero pedir:`
    : `Hola! Vi tu menú en ${menuUrl} y quiero pedir:`;
  return [intro, itemLine, '¿Tienen disponibilidad?'].join('\n');
}

export function buildWhatsAppOrderUrl(input: {
  phone: string | null | undefined;
  slug: string;
  itemName: string;
  quantity?: number;
  locale?: 'es' | 'en';
  restaurantName?: string;
  price?: string;
}) {
  const phone = normalizeWhatsAppPhone(input.phone);
  if (!phone || !isValidWhatsAppPhone(phone)) return null;
  const waPhone = phone.replace(/\D/g, '');

  const text = encodeURIComponent(
    buildWhatsAppOrderMessage({
      slug: input.slug,
      itemName: input.itemName,
      quantity: input.quantity,
      locale: input.locale,
      restaurantName: input.restaurantName,
      price: input.price,
    }),
  );

  return `https://wa.me/${waPhone}?text=${text}`;
}
