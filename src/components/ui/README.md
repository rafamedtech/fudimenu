# UI primitives

Componentes base de Fudimenu. Todos consumen tokens de [`tailwind.config.ts`](../../../tailwind.config.ts) y CSS vars de [`globals.css`](../../app/globals.css). Brand-themeable colors → CSS vars (`--brand-*`); colors estáticos → escala Tailwind (`ink`, `coral`, `menta`).

## Button — `button.tsx`

Acción principal. CVA: 7 variants × 5 sizes.

| variant | uso |
|---------|-----|
| `primary` (default) | acción principal |
| `secondary` | acción de apoyo |
| `ghost` | acción terciaria / toolbar |
| `outline` | acción secundaria con borde |
| `destructive` | borrar / acción irreversible |
| `success` | confirmación positiva |
| `premium` | upsell / CTA Pro (gradiente) |

| size | altura |
|------|--------|
| `sm` | h-10 |
| `md` (default) | h-11 |
| `lg` | h-12 |
| `xl` | h-14 |
| `icon` | 44×44 cuadrado |

**Props extra:** `loading?: boolean` → muestra Spinner, deshabilita, setea `aria-busy`.
**Estados:** default / hover / `active:scale-95` / `disabled` (opacity-40) / loading. Focus: `shadow-glow-mostaza`.
**A11y:** `min-h-11 min-w-11` (target táctil 44px). `type="button"` por default — pasar `type="submit"` en forms.

```tsx
<Button variant="destructive" size="lg" loading={pending} onClick={onDelete}>Borrar</Button>
```

## Input — `input.tsx`

Campo de texto con label, error, hint, prefix opcionales. `id` deriva de `id ?? name ?? useId()` → label `htmlFor` siempre conectado.

| prop | tipo | nota |
|------|------|------|
| `label` | string | renderiza `<label htmlFor>` |
| `error` | string | borde rojo + mensaje |
| `hint` | string | texto ayuda (oculto si hay error) |
| `prefix` | ReactNode | adorno izquierdo (ícono/símbolo) |
| `containerClassName` / `labelClassName` / `controlClassName` | string | override por capa |

**Estados:** default / focus-within (`shadow-glow-mostaza`) / error. Altura fija `h-14` (sin size variants — ver TODO).

## Toggle — `toggle.tsx`

Switch on/off controlado. `'use client'`.

| prop | tipo |
|------|------|
| `checked` | boolean |
| `onChange` | `(next: boolean) => void` |
| `disabled` | boolean |
| `ariaLabel` | string |

**A11y:** `role="switch"` + `aria-checked`. Pasar `ariaLabel` siempre (no hay label visible). Track: `menta-500` on / `ink-300` off.

## Card — `card.tsx`

Contenedor. Div con `rounded-xl`, borde, `shadow-md`, hover→`shadow-lg` (solo desktop). Sin variants — componer con `className`.

## Sheet — `sheet.tsx`

Bottom drawer sobre `vaul`. `'use client'`. Controlado.

| prop | tipo |
|------|------|
| `open` | boolean |
| `onOpenChange` | `(open: boolean) => void` |
| `title` | string opcional → `Drawer.Title` |
| `children` | ReactNode |

**A11y:** vaul maneja focus-trap + Escape + scroll-lock. `max-h-95vh`, drag-handle visual, `pb-safe`.

## Skeleton — `skeleton.tsx`

Placeholder de carga con shimmer. `Skeleton` base + presets compuestos: `StatCardSkeleton`, `FormSkeleton` (exportados).

```tsx
<Skeleton className="h-4 w-2/3" />
```

## EmptyState — `empty-state.tsx`

Estado vacío con doodle/emoji, título, descripción, acción.

| prop | tipo | default |
|------|------|---------|
| `doodle` | nombre Doodle | `'empty-menu'` |
| `emoji` | string | `'🌮'` (fallback si no doodle) |
| `title` | string | — |
| `description` | string | — |
| `action` | ReactNode | — |

---

## TODO / deuda conocida

- **Input** sin size variants (`h-14` fijo) vs Button con 5 — asimetría. Añadir solo si surge caller.
- `fudi-title` / `fudi-body-lg` (globals.css) definidos, 0 usos. `fudi-h1` 1 uso.
- Sin dark mode (`color-scheme: light` lockeado) — decisión, no bug.
- Toast en `admin-providers.tsx`: `color`/`border` literales (inline JS no alcanza escala Tailwind; no hay CSS vars de `ink`).
