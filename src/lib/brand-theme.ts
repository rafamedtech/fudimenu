import type { CSSProperties } from 'react';

const DEFAULT_BRAND = '#F4B400';
const INK = '#1A1611';
const CREAM = '#FFFCF5';
const WHITE = '#FFFFFF';
const LEGACY_SURFACE_COLORS = new Set(['#FFFCF5', '#FFF8E7', '#FFF8E1', '#FFF1C2']);

type Rgb = {
  r: number;
  g: number;
  b: number;
};

type BrandThemeStyle = CSSProperties & Record<`--brand-${string}`, string>;

function normalizeHex(value: string | null | undefined) {
  const color = value?.trim();
  return color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color.toUpperCase() : DEFAULT_BRAND;
}

function hexToRgb(hex: string): Rgb {
  const raw = hex.slice(1);
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb) {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function mix(a: string, b: string, amount: number) {
  const colorA = hexToRgb(a);
  const colorB = hexToRgb(b);
  return rgbToHex({
    r: Math.round(colorA.r + (colorB.r - colorA.r) * amount),
    g: Math.round(colorA.g + (colorB.g - colorA.g) * amount),
    b: Math.round(colorA.b + (colorB.b - colorA.b) * amount),
  });
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function rgbTriplet(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return `${r} ${g} ${b}`;
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function buildBrandThemeStyle(primaryColor: string | null | undefined): BrandThemeStyle {
  const primary = normalizeHex(primaryColor);
  const isLight = relativeLuminance(primary) > 0.46;
  const onPrimary = isLight ? INK : WHITE;
  const primaryHover = mix(primary, isLight ? WHITE : INK, isLight ? 0.18 : 0.12);
  const primaryPressed = mix(primary, INK, isLight ? 0.16 : 0.24);
  const primarySoft = mix(primary, WHITE, 0.78);
  const primaryMuted = mix(primary, CREAM, 0.9);
  const surface = mix(primary, CREAM, 0.94);
  const surfaceStrong = mix(primary, CREAM, 0.88);
  const card = mix(primary, WHITE, 0.97);
  const cardStrong = mix(primary, WHITE, 0.92);
  const accentText = mix(primary, INK, isLight ? 0.34 : 0.1);

  return {
    '--brand-primary': primary,
    '--brand-primary-rgb': rgbTriplet(primary),
    '--brand-primary-hover': primaryHover,
    '--brand-primary-hover-rgb': rgbTriplet(primaryHover),
    '--brand-primary-pressed': primaryPressed,
    '--brand-primary-pressed-rgb': rgbTriplet(primaryPressed),
    '--brand-primary-soft': primarySoft,
    '--brand-primary-soft-rgb': rgbTriplet(primarySoft),
    '--brand-primary-muted': primaryMuted,
    '--brand-primary-muted-rgb': rgbTriplet(primaryMuted),
    '--brand-primary-faint': rgba(primary, 0.14),
    '--brand-primary-ring': rgba(primary, 0.24),
    '--brand-primary-border': rgba(primary, 0.38),
    '--brand-primary-border-rgb': rgbTriplet(primary),
    '--brand-accent-text': accentText,
    '--brand-accent-text-rgb': rgbTriplet(accentText),
    '--brand-on-primary': onPrimary,
    '--brand-surface': surface,
    '--brand-surface-rgb': rgbTriplet(surface),
    '--brand-surface-strong': surfaceStrong,
    '--brand-surface-strong-rgb': rgbTriplet(surfaceStrong),
    '--brand-surface-translucent': rgba(surface, 0.94),
    '--brand-card': card,
    '--brand-card-rgb': rgbTriplet(card),
    '--brand-card-strong': cardStrong,
    '--brand-card-strong-rgb': rgbTriplet(cardStrong),
    '--brand-card-border': rgba(primary, 0.16),
  };
}

export function resolveBrandSurfaceColor(color: string | null | undefined) {
  const normalized = color?.trim().toUpperCase();
  return normalized && !LEGACY_SURFACE_COLORS.has(normalized)
    ? normalized
    : 'var(--brand-card-strong)';
}
