'use client';

import Image from 'next/image';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type ImageKind = 'logo' | 'item' | 'section';

interface ImageUploadFieldProps {
  kind: ImageKind;
  label: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  fallback?: React.ReactNode;
}

export function ImageUploadField({
  kind,
  label,
  value,
  onChange,
  fallback,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    const formData = new FormData();
    formData.set('kind', kind);
    formData.set('file', file);

    setUploading(true);
    try {
      const response = await fetch('/api/uploads/cloudinary', {
        method: 'POST',
        body: formData,
      });
      const result = (await response.json()) as { ok: boolean; url?: string; error?: string };

      if (!response.ok || !result.ok || !result.url) {
        toast.error(result.error === 'cloudinary_not_configured'
          ? 'Cloudinary no está configurado'
          : 'No pude subir la imagen');
        return;
      }

      onChange(result.url);
      toast.success('Imagen subida');
    } catch {
      toast.error('No pude subir la imagen');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink-700">{label}</p>
      <div className="relative flex min-h-40 w-full items-center justify-center overflow-hidden rounded-md border-[1.5px] border-dashed border-ink-300 bg-[var(--brand-surface-strong)]">
        {value ? (
          <Image src={value} alt="" fill sizes="400px" className="object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-ink-500">
            {fallback ?? <ImagePlus className="h-10 w-10" aria-hidden />}
            <span className="text-sm font-semibold">Sin imagen</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--brand-card)]">
            <Loader2 className="h-7 w-7 animate-spin text-ink-700" aria-hidden />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          loading={uploading}
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          Subir
        </Button>
        <Button type="button" variant="ghost" onClick={() => onChange(null)} disabled={!value}>
          <X className="h-4 w-4" aria-hidden />
          Quitar
        </Button>
      </div>
    </div>
  );
}
