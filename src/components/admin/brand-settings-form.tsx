'use client';

import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { useReducer } from 'react';
import { BrandSlugInput } from '@/app/(admin)/settings/brand/brand-slug-input';
import { ImageUploadField } from '@/components/admin/image-upload-field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { buildBrandThemeStyle } from '@/lib/brand-theme';
import { updateBrandSettingsFormAction } from '@/server/actions/tenant.actions';

const BRAND_COLORS = ['#F4B400', '#32D583', '#FF6B4A', '#3B82F6', '#A855F7', '#1A1611'];

interface BrandSettingsFormProps {
  currentSlug: string;
  tenantName: string;
  logoUrl: string | null;
  primaryColor: string;
}

function BrandPreview({ tenantName, logoUrl, color }: { tenantName: string; logoUrl: string | null; color: string }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-surface)] shadow-sm"
      style={buildBrandThemeStyle(color)}
    >
      <p className="border-b border-[var(--brand-card-border)] bg-[var(--brand-card)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
        Vista previa
      </p>
      <div className="bg-[var(--brand-card)] px-4 py-5 text-center">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={tenantName}
            width={56}
            height={56}
            className="mx-auto mb-2 rounded-full object-cover"
          />
        ) : (
          <div
            className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full text-2xl"
            style={{ backgroundColor: 'var(--brand-primary-faint)' }}
          >
            🍽️
          </div>
        )}
        <p className="font-extrabold text-ink-900">{tenantName || 'Tu restaurante'}</p>
      </div>
      <div className="flex gap-2 overflow-x-auto bg-[var(--brand-surface-translucent)] px-3 py-2">
        <span
          className="whitespace-nowrap rounded-full bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-extrabold text-[var(--brand-on-primary)] shadow-sm"
        >
          Sección
        </span>
        <span className="whitespace-nowrap rounded-full bg-[var(--brand-card)] px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm">
          Otra
        </span>
      </div>
    </div>
  );
}

function FieldSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-ink-500">{eyebrow}</p>
        <h3 className="mt-0.5 font-heading text-lg font-extrabold text-ink-900">{title}</h3>
      </div>
      <Card className="ipad:p-5">{children}</Card>
    </section>
  );
}

export function BrandSettingsForm({
  currentSlug,
  tenantName,
  logoUrl,
  primaryColor,
}: BrandSettingsFormProps) {
  const [logo, setLogo] = useReducer((_: string | null, next: string | null) => next, logoUrl);
  const [color, setColor] = useReducer((_: string, next: string) => next, primaryColor);

  return (
    <form
      action={updateBrandSettingsFormAction}
      className="grid gap-6 ipad-landscape:grid-cols-[minmax(0,1fr)_340px] ipad-landscape:items-start ipad-landscape:gap-8"
      style={buildBrandThemeStyle(color)}
    >
      <input type="hidden" name="logoUrl" value={logo ?? ''} />

      <div className="flex flex-col gap-6 ipad:gap-8">
        <FieldSection eyebrow="Dirección web" title="URL pública">
          <BrandSlugInput currentSlug={currentSlug} />
        </FieldSection>

        <FieldSection eyebrow="Imagen" title="Logo">
          <ImageUploadField
            kind="logo"
            label="Sube el logo de tu restaurante"
            value={logo}
            onChange={setLogo}
            fallback={<ImageIcon className="size-10" aria-hidden />}
          />
        </FieldSection>

        <FieldSection eyebrow="Tema" title="Color primario">
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-2">
              {BRAND_COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-label={`Usar color ${option}`}
                  aria-pressed={color === option}
                  className="h-12 rounded-md border-[1.5px] border-ink-200 ring-offset-2 transition-all aria-pressed:ring-2 aria-pressed:ring-[var(--brand-primary)]"
                  style={{ backgroundColor: option }}
                  onClick={() => setColor(option)}
                />
              ))}
            </div>
            <Input
              name="primaryColor"
              type="text"
              label="Hex personalizado"
              placeholder="#F4B400"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              pattern="^#[0-9A-Fa-f]{6}$"
              title="Usa formato hex #RRGGBB"
            />
          </div>
        </FieldSection>
      </div>

      <aside className="flex flex-col gap-4 ipad-landscape:sticky ipad-landscape:top-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider text-ink-500">En vivo</p>
          <h3 className="mt-0.5 font-heading text-lg font-extrabold text-ink-900">Vista previa</h3>
        </div>
        <BrandPreview tenantName={tenantName} logoUrl={logo} color={color} />
        <Button type="submit" className="w-full">
          Guardar ajustes
        </Button>
      </aside>
    </form>
  );
}
