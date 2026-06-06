import { describe, expect, it } from 'vitest';
import {
  isItemImageCrop,
  withDeliveryTransform,
  withItemImageCrop,
} from '../../src/lib/cloudinary';

const UPLOAD = 'https://res.cloudinary.com/test/image/upload';

describe('withDeliveryTransform', () => {
  it('injects f_auto,q_auto after the upload marker', () => {
    expect(withDeliveryTransform(`${UPLOAD}/v1/fudimenu/a.jpg`)).toBe(
      `${UPLOAD}/f_auto,q_auto/v1/fudimenu/a.jpg`,
    );
  });

  it('is idempotent — never doubles the base transform', () => {
    const once = withDeliveryTransform(`${UPLOAD}/v1/fudimenu/a.jpg`);
    expect(withDeliveryTransform(once)).toBe(once);
  });

  it('appends extra transforms while keeping f_auto,q_auto first', () => {
    expect(withDeliveryTransform(`${UPLOAD}/f_auto,q_auto/v1/a.jpg`, 'c_fill,g_auto')).toBe(
      `${UPLOAD}/f_auto,q_auto,c_fill,g_auto/v1/a.jpg`,
    );
  });

  it('passes through non-Cloudinary URLs untouched', () => {
    const external = 'https://example.com/photo.jpg';
    expect(withDeliveryTransform(external, 'c_fill,g_auto')).toBe(external);
  });
});

describe('withItemImageCrop', () => {
  it('returns only the base transform when no crop is set', () => {
    expect(
      withItemImageCrop(`${UPLOAD}/v1/a.jpg`, null, { aspect: '1:1', width: 224 }),
    ).toBe(`${UPLOAD}/f_auto,q_auto/v1/a.jpg`);
  });

  it('maps a crop preset to a Cloudinary fill+gravity transform', () => {
    expect(
      withItemImageCrop(`${UPLOAD}/v1/a.jpg`, 'top', { aspect: '4:3', width: 800 }),
    ).toBe(`${UPLOAD}/f_auto,q_auto,c_fill,g_north,ar_4:3,w_800/v1/a.jpg`);
  });

  it('uses g_auto for the auto preset', () => {
    expect(
      withItemImageCrop(`${UPLOAD}/v1/a.jpg`, 'auto', { aspect: '1:1', width: 224 }),
    ).toContain('g_auto');
  });
});

describe('isItemImageCrop', () => {
  it('accepts known presets and rejects everything else', () => {
    expect(isItemImageCrop('center')).toBe(true);
    expect(isItemImageCrop('bottom')).toBe(true);
    expect(isItemImageCrop('diagonal')).toBe(false);
    expect(isItemImageCrop(null)).toBe(false);
    expect(isItemImageCrop(42)).toBe(false);
  });
});
