import { describe, expect, it } from 'vitest';
import { sanitizePlainText } from '../../src/lib/sanitize';

describe('sanitizePlainText', () => {
  it('removes script tags and their content', () => {
    expect(sanitizePlainText('<script>alert(1)</script>Tacos', 80)).toBe('Tacos');
  });

  it('replaces control chars with whitespace', () => {
    expect(sanitizePlainText('Tacos\x00al pastor', 80)).toBe('Tacos al pastor');
  });

  it('collapses whitespace', () => {
    expect(sanitizePlainText(' multiple   spaces ', 80)).toBe('multiple spaces');
  });

  it('returns null for nullish or empty input', () => {
    expect(sanitizePlainText(null, 80)).toBeNull();
    expect(sanitizePlainText('', 80)).toBeNull();
  });

  it('truncates to maxLength', () => {
    expect(sanitizePlainText('abcdefghij', 5)).toBe('abcde');
  });

  it('removes balanced and unbalanced tags', () => {
    expect(sanitizePlainText('<strong>Tacos</strong>', 80)).toBe('Tacos');
    expect(sanitizePlainText('<strong>Tacos', 80)).toBe('Tacos');
  });
});
