// Derives QR / campaign attribution from the public-menu URL query string.
// PostHog-only: never persisted to the restaurant system metrics (MenuView).
// Anonymized by design — only short, low-cardinality utm tokens are kept.

const MAX_TOKEN_LENGTH = 64;

function cleanToken(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().toLocaleLowerCase().slice(0, MAX_TOKEN_LENGTH);
  return trimmed || undefined;
}

export type TrafficSource = { source?: string; campaign?: string };

// `search` is a raw location.search string (e.g. "?utm_source=qr&utm_campaign=mesa1").
export function parseTrafficSource(search: string): TrafficSource {
  const params = new URLSearchParams(search);
  const source = cleanToken(params.get('utm_source'));
  const campaign = cleanToken(params.get('utm_campaign'));
  const result: TrafficSource = {};
  if (source) result.source = source;
  if (campaign) result.campaign = campaign;
  return result;
}
