const MEXICO_WHATSAPP_PHONE_PATTERN = /^\+52\d{10}$/;

export function normalizeWhatsAppPhone(input: string | null | undefined) {
  const digits = input?.replace(/\D/g, '') ?? '';
  return digits.length > 0 ? `+${digits}` : null;
}

export function isValidWhatsAppPhone(input: string | null | undefined) {
  const phone = normalizeWhatsAppPhone(input);
  return phone !== null && MEXICO_WHATSAPP_PHONE_PATTERN.test(phone);
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://fudimenu.app';
}

export function buildWhatsAppOrderMessage(input: {
  slug: string;
  itemName: string;
  quantity?: number;
}) {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  return [
    `Hola! Vi tu menú en ${baseUrl}/m/${input.slug} y quiero pedir:`,
    `- ${input.itemName} x${input.quantity ?? 1}`,
    '¿Tienen disponibilidad?',
  ].join('\n');
}

export function buildWhatsAppOrderUrl(input: {
  phone: string | null | undefined;
  slug: string;
  itemName: string;
  quantity?: number;
}) {
  const phone = normalizeWhatsAppPhone(input.phone);
  if (!phone || !isValidWhatsAppPhone(phone)) return null;
  const waPhone = phone.replace(/\D/g, '');

  const text = encodeURIComponent(
    buildWhatsAppOrderMessage({
      slug: input.slug,
      itemName: input.itemName,
      quantity: input.quantity,
    }),
  );

  return `https://wa.me/${waPhone}?text=${text}`;
}
