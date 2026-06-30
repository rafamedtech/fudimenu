'use client';

import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { useReducer } from 'react';
import { BrandSlugInput } from '@/app/(admin)/settings/brand/brand-slug-input';
import { ImageUploadField } from '@/components/admin/image-upload-field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SectionHeading } from '@/components/ui/section-heading';
import { buildBrandThemeStyle } from '@/lib/brand-theme';
import { updateBrandSettingsFormAction } from '@/server/actions/tenant.actions';
import type { LogoShape } from '@/types/domain';

const BRAND_COLORS = ['#F4B400', '#32D583', '#FF6B4A', '#3B82F6', '#A855F7', '#1A1611'];
const LOGO_SHAPES: Array<{ value: LogoShape; label: string }> = [
  { value: 'rectangular', label: 'Rectangular' },
  { value: 'square', label: 'Cuadrado' },
  { value: 'round', label: 'Redondo' },
];

interface BrandSettingsFormProps {
  currentSlug: string;
  tenantName: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  logoShape: LogoShape;
  primaryColor: string;
}

function getPreviewLogoClass(shape: LogoShape) {
  if (shape === 'rectangular') return 'h-12 w-24 rounded-md object-contain p-1';
  if (shape === 'square') return 'size-14 rounded-md object-cover';
  return 'size-14 rounded-full object-cover';
}

function BrandPreview({
  tenantName,
  logoUrl,
  coverImageUrl,
  logoShape,
  color,
}: {
  tenantName: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  logoShape: LogoShape;
  color: string;
}) {
  const logoClassName = getPreviewLogoClass(logoShape);

  return (
    <div
      className="overflow-hidden rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-surface)] shadow-sm"
      style={buildBrandThemeStyle(color)}
    >
      <p className="border-b border-[var(--brand-card-border)] bg-[var(--brand-card)] px-3 py-2 text-xs font-semibold text-ink-500">
        Vista previa
      </p>
      <div className="relative h-24 bg-[var(--brand-primary-faint)]">
        {coverImageUrl ? (
          <Image src={coverImageUrl} alt="" fill sizes="340px" className="object-cover" />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, var(--brand-primary-faint) 0%, var(--brand-card-strong) 100%)',
            }}
          />
        )}
      </div>
      <div className="bg-[var(--brand-card)] px-4 py-5 text-center">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={tenantName}
            width={logoShape === 'rectangular' ? 96 : 56}
            height={56}
            className={`mx-auto mb-2 border border-[var(--brand-card-border)] bg-[var(--brand-card)] ${logoClassName}`}
          />
        ) : (
          <div
            className={`mx-auto mb-2 flex items-center justify-center text-2xl ${logoClassName}`}
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
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <SectionHeading
        as="h3"
        title={title}
        description={description}
        titleClassName="text-lg ipad:text-xl"
      />
      <Card className="ipad:p-5">{children}</Card>
    </section>
  );
}

export function BrandSettingsForm({
  currentSlug,
  tenantName,
  logoUrl,
  coverImageUrl,
  logoShape,
  primaryColor,
}: BrandSettingsFormProps) {
  const [logo, setLogo] = useReducer((_: string | null, next: string | null) => next, logoUrl);
  const [cover, setCover] = useReducer(
    (_: string | null, next: string | null) => next,
    coverImageUrl,
  );
  const [shape, setShape] = useReducer((_: LogoShape, next: LogoShape) => next, logoShape);
  const [color, setColor] = useReducer((_: string, next: string) => next, primaryColor);

  return (
    <form
      action={updateBrandSettingsFormAction}
      className="grid gap-6 ipad-landscape:grid-cols-[minmax(0,1fr)_340px] ipad-landscape:items-start ipad-landscape:gap-8"
      style={buildBrandThemeStyle(color)}
    >
      <input type="hidden" name="logoUrl" value={logo ?? ''} />
      <input type="hidden" name="coverImageUrl" value={cover ?? ''} />
      <input type="hidden" name="logoShape" value={shape} />

      <div className="flex flex-col gap-6 ipad:gap-8">
        <FieldSection
          title="URL pública"
          description="El enlace que abrirán tus clientes desde el QR."
        >
          <BrandSlugInput currentSlug={currentSlug} />
        </FieldSection>

        <FieldSection
          title="Logo"
          description="Usa una imagen reconocible incluso en tamaño pequeño."
        >
          <div className="space-y-5">
            <ImageUploadField
              kind="logo"
              label="Sube el logo de tu restaurante"
              value={logo}
              onChange={setLogo}
              fallback={<ImageIcon className="size-10" aria-hidden />}
            />
            <div className="space-y-2">
              <p className="text-sm font-medium text-ink-700">Formato del logo</p>
              <div className="grid grid-cols-3 gap-2">
                {LOGO_SHAPES.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    aria-pressed={shape === option.value}
                    className="h-11 rounded-md border border-ink-200 px-2 text-sm font-bold text-ink-700 transition-all aria-pressed:border-[var(--brand-primary)] aria-pressed:bg-[var(--brand-primary-faint)] aria-pressed:text-ink-900"
                    onClick={() => setShape(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </FieldSection>

        <FieldSection title="Portada" description="Presenta tu restaurante al abrir el menú.">
          <ImageUploadField
            kind="tenant-cover"
            label="Sube una imagen de portada"
            value={cover}
            onChange={setCover}
            fallback={<ImageIcon className="size-10" aria-hidden />}
          />
        </FieldSection>

        <FieldSection
          title="Color primario"
          description="Se aplicará a botones, navegación y acentos del menú."
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {BRAND_COLORS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant="outline"
                  aria-label={`Usar color ${option}`}
                  aria-pressed={color === option}
                  className="size-12 rounded-md border-[1.5px] border-ink-200 ring-offset-2 transition-all aria-pressed:ring-2 aria-pressed:ring-[var(--brand-primary)]"
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
        <SectionHeading
          as="h3"
          title="Vista previa"
          description="Se actualiza mientras editas."
          titleClassName="text-lg ipad:text-xl"
        />
        <BrandPreview
          tenantName={tenantName}
          logoUrl={logo}
          coverImageUrl={cover}
          logoShape={shape}
          color={color}
        />
        <Button type="submit" className="w-full">
          Guardar ajustes
        </Button>
      </aside>
    </form>
  );
}
