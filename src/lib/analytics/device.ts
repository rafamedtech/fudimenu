// Coarse device classification for analytics breakdowns. Mirrors the server's
// UAParser deviceType buckets (track/view route) but stays anonymized: only the
// bucket is kept, never the raw user-agent string.

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function getDeviceType(userAgent: string | null | undefined): DeviceType {
  const ua = (userAgent ?? '').toLowerCase();
  if (!ua) return 'desktop';
  // Tablets first: Android tablets omit the "mobile" token that phones carry.
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(ua)) return 'tablet';
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry|bb10|opera mini/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}
