'use client';

import { ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { BrandSlugInput } from '@/app/(admin)/settings/brand/brand-slug-input';
import { ImageUploadField } from '@/components/admin/image-upload-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateBrandSettingsFormAction } from '@/server/actions/tenant.actions';

const BRAND_COLORS = ['#F4B400', '#32D583', '#FF6B4A', '#3B82F6', '#A855F7', '#1A1611'];

interface BrandSettingsFormProps {
  currentSlug: string;
  logoUrl: string | null;
  primaryColor: string;
}

export function BrandSettingsForm({
  currentSlug,
  logoUrl,
  primaryColor,
}: BrandSettingsFormProps) {
  const [logo, setLogo] = useState<string | null>(logoUrl);
  const [color, setColor] = useState(primaryColor);

  return (
    <form action={updateBrandSettingsFormAction} className="space-y-4">
      <BrandSlugInput currentSlug={currentSlug} />
      <input type="hidden" name="logoUrl" value={logo ?? ''} />
      <ImageUploadField
        kind="logo"
        label="Logo"
        value={logo}
        onChange={setLogo}
        fallback={<ImageIcon className="h-10 w-10" aria-hidden />}
      />
      <div className="space-y-2">
        <p className="text-sm font-medium text-ink-700">Color primario</p>
        <div className="grid grid-cols-6 gap-2">
          {BRAND_COLORS.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={`Usar color ${option}`}
              aria-pressed={color === option}
              className="h-12 rounded-md border-[1.5px] border-ink-200 ring-offset-2 transition-all aria-pressed:ring-2 aria-pressed:ring-mostaza-500"
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
      <Button type="submit" className="w-full">
        Guardar ajustes
      </Button>
    </form>
  );
}
