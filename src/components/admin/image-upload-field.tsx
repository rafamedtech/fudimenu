'use client';

import Image from 'next/image';
import { ImagePlus, Images, Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { listTenantImagesAction } from '@/server/actions/image-library.actions';

type ImageKind = 'logo' | 'tenant-cover' | 'item' | 'section' | 'category';

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [library, setLibrary] = useState<string[] | null>(null);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  async function openPicker() {
    setPickerOpen(true);
    if (library !== null) return;

    setLoadingLibrary(true);
    try {
      const result = await listTenantImagesAction();
      if (!result.ok) {
        toast.error('No pude cargar tus imágenes');
        setLibrary([]);
        return;
      }
      setLibrary(result.images);
    } catch {
      toast.error('No pude cargar tus imágenes');
      setLibrary([]);
    } finally {
      setLoadingLibrary(false);
    }
  }

  function chooseExisting(url: string) {
    onChange(url);
    setPickerOpen(false);
    toast.success('Imagen seleccionada');
  }

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
      // New upload joins the library; force a refetch next time the picker opens.
      setLibrary(null);
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
            {fallback ?? <ImagePlus className="size-10" aria-hidden />}
            <span className="text-sm font-semibold">Sin imagen</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--brand-card)]">
            <Loader2 className="size-7 animate-spin text-ink-700" aria-hidden />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        aria-label={label}
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          loading={uploading}
        >
          <ImagePlus className="size-4" aria-hidden />
          Subir
        </Button>
        <Button type="button" variant="outline" onClick={openPicker} disabled={uploading}>
          <Images className="size-4" aria-hidden />
          Elegir
        </Button>
        <Button type="button" variant="ghost" onClick={() => onChange(null)} disabled={!value}>
          <X className="size-4" aria-hidden />
          Quitar
        </Button>
      </div>

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen} title="Elegir imagen existente">
        {loadingLibrary ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-7 animate-spin text-ink-700" aria-hidden />
          </div>
        ) : library && library.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2">
            {library.map((url) => (
              <li key={url}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => chooseExisting(url)}
                  aria-label="Usar esta imagen"
                  className={`relative aspect-square w-full overflow-hidden rounded-md border-[1.5px] transition-colors ${
                    url === value
                      ? 'border-mostaza-500 ring-2 ring-mostaza-300'
                      : 'border-ink-200 hover:border-mostaza-400'
                  }`}
                >
                  <Image src={url} alt="" fill sizes="120px" className="object-cover" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-ink-500">
            Aún no tienes imágenes. Sube una para empezar tu biblioteca.
          </p>
        )}
      </Sheet>
    </div>
  );
}
