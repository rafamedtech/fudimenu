// Derives QR / campaign attribution from the public-menu URL query string.
// PostHog-only: never persisted to the restaurant system metrics (MenuView).
// Anonymized by design — only short, low-cardinality utm tokens are kept.

const MAX_TOKEN_LENGTH = 64;
const TRAFFIC_SOURCE_SESSION_KEY = 'fudimenu:traffic-source';

function cleanToken(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().toLocaleLowerCase().slice(0, MAX_TOKEN_LENGTH);
  return trimmed || undefined;
}

export type TrafficSource = {
  source?: string;
  campaign?: string;
  utm_source?: string;
  utm_campaign?: string;
};

function isEmptyTrafficSource(value: TrafficSource) {
  return !value.source && !value.campaign && !value.utm_source && !value.utm_campaign;
}

function normalizeTrafficSource(value: Partial<Record<keyof TrafficSource, unknown>>): TrafficSource {
  const source = cleanToken(typeof value.source === 'string' ? value.source : null);
  const campaign = cleanToken(typeof value.campaign === 'string' ? value.campaign : null);
  const utmSource = cleanToken(typeof value.utm_source === 'string' ? value.utm_source : source ?? null);
  const utmCampaign = cleanToken(typeof value.utm_campaign === 'string' ? value.utm_campaign : campaign ?? null);
  const result: TrafficSource = {};
  if (source) result.source = source;
  if (campaign) result.campaign = campaign;
  if (utmSource) result.utm_source = utmSource;
  if (utmCampaign) result.utm_campaign = utmCampaign;
  return result;
}

// `search` is a raw location.search string (e.g. "?utm_source=qr&utm_campaign=mesa1").
export function parseTrafficSource(search: string): TrafficSource {
  const params = new URLSearchParams(search);
  const source = cleanToken(params.get('utm_source'));
  const campaign = cleanToken(params.get('utm_campaign'));
  return normalizeTrafficSource({ source, campaign, utm_source: source, utm_campaign: campaign });
}

export function getStoredTrafficSource(): TrafficSource {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(TRAFFIC_SOURCE_SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Record<keyof TrafficSource, unknown>>;
    return normalizeTrafficSource(parsed);
  } catch {
    return {};
  }
}

export function rememberTrafficSource(search: string): TrafficSource {
  const parsed = parseTrafficSource(search);
  if (isEmptyTrafficSource(parsed)) return getStoredTrafficSource();
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(TRAFFIC_SOURCE_SESSION_KEY, JSON.stringify(parsed));
    } catch {
      // Storage can be unavailable in restricted contexts; attribution should still use this page load.
    }
  }
  return parsed;
}
