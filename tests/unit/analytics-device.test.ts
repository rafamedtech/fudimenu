import { describe, expect, it } from 'vitest';
import { getDeviceType } from '@/lib/analytics/device';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ANDROID_PHONE =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36';
const ANDROID_TABLET =
  'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const IPAD =
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/604.1';
const DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

describe('getDeviceType', () => {
  it('classifies phones as mobile', () => {
    expect(getDeviceType(IPHONE)).toBe('mobile');
    expect(getDeviceType(ANDROID_PHONE)).toBe('mobile');
  });

  // Android tablets lack the "mobile" token — must not fall through to mobile.
  it('classifies tablets as tablet', () => {
    expect(getDeviceType(ANDROID_TABLET)).toBe('tablet');
    expect(getDeviceType(IPAD)).toBe('tablet');
  });

  it('classifies everything else as desktop', () => {
    expect(getDeviceType(DESKTOP)).toBe('desktop');
  });

  // Missing UA must default to a stable bucket, never throw.
  it('defaults to desktop when the user-agent is absent', () => {
    expect(getDeviceType(null)).toBe('desktop');
    expect(getDeviceType('')).toBe('desktop');
  });
});
