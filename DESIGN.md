---
version: alpha
name: FudiMenu Warm Counter
description: A mobile-first restaurant menu operating system with warm cream surfaces, landing-style type scale, squircle-like 12px controls, and a bright mustard action color.
colors:
  primary: "#F4B400"
  on-primary: "#1A1611"
  primary-hover: "#FFC633"
  primary-muted: "#FFF8E1"
  primary-soft: "#FFF1C2"
  primary-deep: "#D69900"
  secondary: "#6BD4A4"
  on-secondary: "#1A1611"
  secondary-muted: "#D4F2E4"
  tertiary: "#7C5CFF"
  on-tertiary: "#FFFFFF"
  tertiary-muted: "#E5DEFF"
  accent-coral: "#FF6B5B"
  accent-coral-muted: "#FFE0DB"
  background: "#FFFCF5"
  surface: "#FFFFFF"
  surface-warm: "#FFF8E7"
  surface-subtle: "#FFF8E1"
  surface-overlay: "#FFFFFF"
  on-background: "#1A1611"
  on-surface: "#1A1611"
  on-surface-strong: "#1A1611"
  on-surface-muted: "#766B5C"
  on-surface-soft: "#C4BCAE"
  outline: "#C4BCAE"
  outline-muted: "#EDE7DB"
  overlay: "#000000"
  inverse: "#1A1611"
  on-inverse: "#FFFFFF"
  success: "#6BD4A4"
  on-success: "#1A1611"
  warning: "#F4B400"
  on-warning: "#1A1611"
  error: "#EF4444"
  on-error: "#FFFFFF"
typography:
  display-lg:
    fontFamily: DM Sans, Inter, system-ui, sans-serif
    fontSize: 60px
    fontWeight: 800
    lineHeight: 66px
    letterSpacing: 0em
  display-md:
    fontFamily: DM Sans, Inter, system-ui, sans-serif
    fontSize: 48px
    fontWeight: 800
    lineHeight: 53px
    letterSpacing: 0em
  display-sm:
    fontFamily: DM Sans, Inter, system-ui, sans-serif
    fontSize: 36px
    fontWeight: 800
    lineHeight: 40px
    letterSpacing: 0em
  headline-lg:
    fontFamily: DM Sans, Inter, system-ui, sans-serif
    fontSize: 32px
    fontWeight: 800
    lineHeight: 38px
    letterSpacing: 0em
  headline-md:
    fontFamily: DM Sans, Inter, system-ui, sans-serif
    fontSize: 24px
    fontWeight: 800
    lineHeight: 29px
    letterSpacing: 0em
  title-lg:
    fontFamily: DM Sans, Inter, system-ui, sans-serif
    fontSize: 20px
    fontWeight: 800
    lineHeight: 24px
    letterSpacing: 0em
  title-md:
    fontFamily: DM Sans, Inter, system-ui, sans-serif
    fontSize: 18px
    fontWeight: 800
    lineHeight: 22px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 32px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0em
  label-sm:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0em
  label-xs:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 11px
    fontWeight: 600
    lineHeight: 14px
    letterSpacing: 0em
  data-lg:
    fontFamily: DM Sans, Inter, system-ui, sans-serif
    fontSize: 36px
    fontWeight: 800
    lineHeight: 40px
    letterSpacing: 0em
    fontFeature: "tnum"
spacing:
  xxs: 2px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  "2xl": 20px
  "3xl": 24px
  "4xl": 32px
  "5xl": 40px
  "6xl": 48px
  screen-gutter: 16px
  screen-gutter-wide: 24px
  card-padding: 16px
  compact-card-padding: 12px
  section-gap: 32px
  bottom-nav-height: 72px
  bottom-action-offset: 88px
rounded:
  xs: 6px
  sm: 10px
  md: 12px
  lg: 16px
  xl: 20px
  "2xl": 24px
  full: 9999px
shadows:
  sm: "0 1px 2px rgba(26, 22, 17, 0.06)"
  md: "0 4px 12px rgba(26, 22, 17, 0.08)"
  lg: "0 12px 32px rgba(26, 22, 17, 0.12)"
  xl: "0 24px 64px rgba(26, 22, 17, 0.16)"
  focus: "0 0 0 4px rgba(244, 180, 0, 0.20)"
elevation:
  flat:
    backgroundColor: "{colors.background}"
    shadow: none
  raised:
    backgroundColor: "{colors.surface}"
    shadow: "{shadows.sm}"
  card:
    backgroundColor: "{colors.surface}"
    shadow: "{shadows.md}"
  floating:
    backgroundColor: "{colors.surface}"
    shadow: "{shadows.lg}"
  modal:
    backgroundColor: "{colors.surface}"
    shadow: "{shadows.xl}"
motion:
  fast:
    duration: 150ms
    easing: ease-out
  base:
    duration: 200ms
    easing: ease-out
  spring:
    duration: 200ms
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)"
  shimmer:
    duration: 1500ms
    easing: linear
components:
  app-shell:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    width: 448px
  app-header:
    backgroundColor: "#FFFCF5"
    textColor: "{colors.on-surface}"
    typography: "{typography.title-md}"
    height: 56px
    padding: 8px
  bottom-navigation:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    height: "{spacing.bottom-nav-height}"
  bottom-navigation-active:
    textColor: "{colors.primary}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: 44px
    padding: 0 20px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.outline-muted}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: 44px
    padding: 0 20px
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: 44px
    padding: 0 20px
    borderWidth: 1.5px
  button-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.on-success}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: 44px
    padding: 0 20px
  button-premium:
    backgroundColor: "#F4B400"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: 44px
    padding: 0 20px
  button-sizes:
    sm:
      height: 40px
      padding: 0 16px
      typography: "{typography.label-md}"
    md:
      height: 44px
      padding: 0 20px
      typography: "{typography.label-md}"
    lg:
      height: 48px
      padding: 0 24px
      typography: "{typography.body-md}"
    xl:
      height: 56px
      padding: 0 32px
      typography: "{typography.body-md}"
    icon:
      size: 44px
      padding: 0
  floating-action-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    size: 56px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.card-padding}"
  compact-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.compact-card-padding}"
  warm-empty-state:
    backgroundColor: "{colors.surface-warm}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: 48px 24px
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 56px
    padding: 0 16px
  input-field-focus:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
  toggle-on:
    backgroundColor: "{colors.success}"
    rounded: "{rounded.full}"
    width: 52px
    height: 32px
  toggle-off:
    backgroundColor: "{colors.outline}"
    rounded: "{rounded.full}"
    width: 52px
    height: 32px
  menu-item-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.compact-card-padding}"
  menu-item-image:
    backgroundColor: "{colors.surface-warm}"
    rounded: "{rounded.md}"
    size: 64px
  category-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label-md}"
    rounded: "{rounded.xl}"
    padding: 8px 16px
    borderWidth: 1px
    borderColor: "{colors.outline-muted}"
  category-chip-active:
    backgroundColor: "{colors.primary-faint}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.xl}"
    padding: 8px 16px
    borderWidth: 2px
    borderColor: "{colors.primary}"
    shadow: "{shadows.focus}"
  selected-choice:
    backgroundColor: "{colors.primary-faint}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    borderWidth: 2px
    borderColor: "{colors.primary}"
    shadow: "{shadows.focus}"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
  skeleton:
    backgroundColor: "{colors.surface-warm}"
    rounded: "{rounded.md}"
  progress-track:
    backgroundColor: "{colors.outline-muted}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    height: 6px
  progress-fill:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    height: 6px
  primary-pressed:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  sold-out-overlay:
    backgroundColor: "{colors.overlay}"
    textColor: "{colors.on-inverse}"
    typography: "{typography.label-xs}"
  status-success:
    backgroundColor: "{colors.secondary-muted}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
  status-available:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
  status-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.on-warning}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
  status-error:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
  coral-accent:
    backgroundColor: "{colors.accent-coral}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  coral-soft-panel:
    backgroundColor: "{colors.accent-coral-muted}"
    textColor: "{colors.on-surface-strong}"
    rounded: "{rounded.lg}"
    padding: "{spacing.card-padding}"
  grape-accent:
    backgroundColor: "{colors.tertiary}"
    rounded: "{rounded.md}"
  grape-soft-panel:
    backgroundColor: "{colors.tertiary-muted}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.card-padding}"
  warm-highlight:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.card-padding}"
  inverse-overlay-label:
    backgroundColor: "{colors.inverse}"
    textColor: "{colors.on-inverse}"
    typography: "{typography.label-xs}"
    rounded: "{rounded.sm}"
  subtle-surface:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.card-padding}"
  overlay-surface:
    backgroundColor: "{colors.surface-overlay}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.card-padding}"
  soft-muted-label:
    backgroundColor: "{colors.inverse}"
    textColor: "{colors.on-surface-soft}"
    typography: "{typography.label-sm}"
  tertiary-inverse-label:
    backgroundColor: "{colors.inverse}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
  error-inverse-label:
    backgroundColor: "{colors.inverse}"
    textColor: "{colors.on-error}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
---

## Overview

FudiMenu feels like a practical counter tool for small restaurants: fast, warm, and a little playful without becoming decorative. It is built mobile-first, with a narrow app shell, thumb-friendly controls, compact card lists, sticky navigation, and clear one-handed actions. The identity should feel like a sunny printed menu brought into a lightweight admin app.

The emotional tone is informal confidence. Headlines and empty states can carry food emoji and conversational Spanish copy, while the UI structure remains direct and operational. The product should help an owner update prices, mark items sold out, and share a menu without feeling like enterprise software.

## Colors

The canvas is warm cream, not white. White is reserved for cards, forms, chips, and navigation surfaces so content feels lifted from the page. Deep ink anchors text and makes the soft background usable in bright environments.

Mustard is the signature action color. Use it for primary buttons, active navigation, progress indicators, focus rings, and small brand marks. Mint signals success and availability. Coral marks sold-out counts, destructive moments, or warm promotional emphasis. Grape is a secondary celebratory accent and should be used sparingly.

Avoid broad saturated fields. The system gets its personality from small bursts of color against cream and white, plus food photography or emoji where a dish image is missing.

## Typography

Typography uses Satoshi first, with Inter and system sans-serif fallbacks. The voice is rounded, modern, and highly legible. Headings are heavy and compact; body and input text are medium enough to stay readable on mobile screens.

Use extra-bold type for brand moments, onboarding questions, and numeric dashboard highlights. Use tabular numerals for metrics, prices, and counts so dashboard cards do not jitter. Labels, helper text, and metadata should be smaller and muted rather than all-caps, except for status overlays such as sold-out badges.

Section headers start with the heading itself. Add sentence-case supporting copy below only when it helps the user act or understand scope. Do not place topical eyebrows above headings. Plan and status information belongs in a badge beside the heading, while category context belongs in normal supporting text below it.

## Layout

The product is centered around a single-column mobile shell with a maximum width near 448px. Page gutters are usually 16px in the app and 24px on landing, auth, and onboarding screens. Vertical rhythm is compact: lists use 8px to 12px gaps, forms use 16px gaps, and larger content sections use 32px or more.

Interfaces should prioritize scanning. Item rows pair a square thumbnail with name, price, and availability controls. Dashboards use a larger metric card followed by dense secondary cards. Public menus use sticky horizontal category chips, then category sections with simple stacked food cards.

Bottom navigation and floating actions are first-class layout elements. Keep primary save/add actions reachable near the bottom and reserve enough bottom spacing so fixed controls do not cover content.

## Elevation & Depth

Depth is soft and warm. Use white surfaces with low-opacity ink shadows; the shadows should feel like paper or laminated menu cards rather than glass or heavy modals. Important metric cards can use a subtle warm gradient from pale mustard to white.

Headers and nav bars may use translucent warm cream or white with backdrop blur. Sheets use a stronger shadow and a rounded top edge, with a dark translucent overlay behind them.

## Shapes

The shape language is friendly and tactile. Cards, category chips, and choice selectors all share the same generous 20px (`rounded.xl`) corners so list surfaces feel consistent. Inputs and standard buttons use 12px corners; smaller controls use 10px. Toggles, avatars, logos, floating action buttons, and status badges remain fully rounded.

Selected/active surfaces share a single visual recipe: 2px brand-primary border, a soft brand-faint fill (`primary-faint`), the same `rounded.xl` corners, and a soft mustard focus halo (`shadows.focus`). The label stays ink-dark — never invert the text to white on tap. This treatment applies to choice cards, category chips, segmented controls, and the active state in horizontal scrollers.

Do not mix sharp editorial corners into the product. Even utility surfaces should retain enough radius to feel approachable and food-service friendly.

## Components

Primary buttons are mustard with dark ink text, medium-to-bold typography, and a slight active scale-down. Secondary buttons are warm neutral fills. Outlined buttons are white with a 1.5px warm gray border. Premium or celebratory actions may use a mustard-to-coral treatment, but keep that rare.

Cards are white, rounded, and compact. Menu item cards should stay horizontal and information-dense. Image placeholders use warm cream and food emoji when no photo is available. Sold-out overlays are dark translucent layers with tiny bold uppercase text.

Inputs are 56px tall, white, and bordered. Focus states use mustard borders and a soft mustard focus halo. Textareas follow the same border and radius. Toggles use mint for on, warm gray for off, and a white circular knob with a soft shadow.

Navigation is mobile-native: a sticky top header with centered title, a fixed bottom tab bar, active mustard icon/text, and subtle active scale. Category chips on the public menu are rounded-xl white surfaces with a 1px outline; the active chip switches to the selected-surface recipe (brand-faint fill, 2px brand-primary border, soft focus halo).

## Do's and Don'ts

- Do keep screens narrow, direct, and thumb-friendly.
- Do use mustard for the main action or active state, not as a large background wash.
- Do let white cards sit on warm cream backgrounds for most hierarchy.
- Do use food emoji or dish photos as small identity cues.
- Do use tabular numerals for prices, counts, and analytics.
- Don't make the UI feel like a marketing landing page inside admin workflows.
- Don't introduce cold gray backgrounds when warm cream or white would preserve the brand.
- Don't use heavy shadows, glassmorphism, or dark-mode surfaces as the default identity.
- Don't overuse coral, mint, or grape; they are accents and status colors.
- Don't crowd fixed bottom actions against the bottom navigation.
