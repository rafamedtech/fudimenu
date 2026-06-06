/**
 * Central Cloudinary delivery-URL helpers. Keep all string manipulation of
 * Cloudinary URLs here so components and the upload route never hand-roll it.
 *
 * `f_auto,q_auto` is the baseline delivery transform (browser-dependent format
 * + automatic quality). It must live in the delivery URL, never as an upload
 * transformation, so the stored original stays intact. Editorial crop is also
 * a delivery-time transform — we never re-upload files to crop them.
 */

const UPLOAD_MARKER = '/image/upload/';
const BASE_TRANSFORM = 'f_auto,q_auto';

/** Editorial crop presets — gravity only, applied via Cloudinary `c_fill`. */
export const ITEM_IMAGE_CROPS = ['auto', 'center', 'top', 'bottom'] as const;
export type ItemImageCrop = (typeof ITEM_IMAGE_CROPS)[number];

const CROP_GRAVITY: Record<ItemImageCrop, string> = {
  auto: 'g_auto',
  center: 'g_center',
  top: 'g_north',
  bottom: 'g_south',
};

const CROP_SET: ReadonlySet<string> = new Set(ITEM_IMAGE_CROPS);

export function isItemImageCrop(value: unknown): value is ItemImageCrop {
  return typeof value === 'string' && CROP_SET.has(value);
}

/**
 * Insert a delivery transform into a Cloudinary upload URL, always keeping
 * `f_auto,q_auto` first and idempotent: a URL already carrying the base
 * transform is rewritten rather than doubled. Non-Cloudinary URLs pass through
 * untouched so callers can use this unconditionally.
 */
export function withDeliveryTransform(url: string, extra?: string | null): string {
  const markerIndex = url.indexOf(UPLOAD_MARKER);
  if (markerIndex === -1) return url;

  const head = url.slice(0, markerIndex + UPLOAD_MARKER.length);
  let tail = url.slice(markerIndex + UPLOAD_MARKER.length);

  // Drop an existing base transform segment so re-applying stays idempotent.
  if (tail.startsWith(`${BASE_TRANSFORM}/`)) {
    tail = tail.slice(BASE_TRANSFORM.length + 1);
  }

  const transform = extra ? `${BASE_TRANSFORM},${extra}` : BASE_TRANSFORM;
  return `${head}${transform}/${tail}`;
}

/**
 * Build the delivery URL for a menu-item image, honoring the editorial crop
 * preset. Without a crop the image is returned with only the base transform
 * (CSS object-cover handles framing). With a crop, Cloudinary fills the given
 * aspect/width using the preset's gravity so the right part of the dish shows.
 */
export function withItemImageCrop(
  url: string,
  crop: ItemImageCrop | null | undefined,
  context: { aspect: string; width: number },
): string {
  if (!crop) return withDeliveryTransform(url);
  const extra = `c_fill,${CROP_GRAVITY[crop]},ar_${context.aspect},w_${context.width}`;
  return withDeliveryTransform(url, extra);
}
