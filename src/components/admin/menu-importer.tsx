'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Download, FileUp, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { parseCsv } from '@/lib/import/csv';
import { mapRows, type MapRowsResult } from '@/lib/import/menu-import';
import { importMenuAction } from '@/server/actions/import.actions';

const HEADER_LABELS: Record<string, string> = { name: 'nombre', price: 'precio' };

interface MenuImporterProps {
  existingItemNames: string[];
  existingSectionNames: string[];
  itemLimit: number | null;
  sectionLimit: number | null;
  currentItemCount: number;
}

export function MenuImporter({
  existingItemNames,
  existingSectionNames,
  itemLimit,
  sectionLimit,
  currentItemCount,
}: MenuImporterProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<MapRowsResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const existingNameSet = useMemo(
    () => new Set(existingItemNames.map((n) => n.toLowerCase())),
    [existingItemNames],
  );

  async function handleFile(file: File) {
    const text = await file.text();
    setFileName(file.name);
    setCsv(text);
    setPreview(mapRows(parseCsv(text)));
  }

  function planBlock(valid: { sectionName: string | null }[]): string | null {
    if (itemLimit !== null && currentItemCount + valid.length > itemLimit) {
      return `Tu plan permite ${itemLimit} platillos. Este archivo los excede.`;
    }
    if (sectionLimit !== null) {
      const existing = new Set(existingSectionNames);
      const newSections = new Set(
        valid
          .map((r) => r.sectionName)
          .filter((s): s is string => s !== null && !existing.has(s)),
      );
      if (existing.size + newSections.size > sectionLimit) {
        return `Tu plan permite ${sectionLimit} secciones. Este archivo las excede.`;
      }
    }
    return null;
  }

  function handleImport() {
    startTransition(async () => {
      const result = await importMenuAction({ csv });
      if (result.ok) {
        const { itemsCreated, categoriesCreated, sectionsCreated } = result.result;
        toast.success(
          `Importados ${itemsCreated} platillos, ${categoriesCreated} categorías, ${sectionsCreated} secciones`,
        );
        router.push('/menu');
        router.refresh();
        return;
      }

      switch (result.code) {
        case 'plan_limit_reached':
          toast.error('Llegaste al límite de tu plan. Mejora tu plan para importar más.');
          break;
        case 'rate_limited':
          toast.error('Demasiados intentos. Espera un momento.');
          break;
        case 'too_large':
          toast.error('El archivo es demasiado grande (máx 500 filas).');
          break;
        case 'validation':
          toast.error('Revisa los errores del archivo antes de importar.');
          break;
        default:
          toast.error('No se pudo iniciar sesión. Vuelve a entrar.');
      }
    });
  }

  const valid = preview?.ok ? preview.valid : [];
  const planMessage = preview?.ok ? planBlock(valid) : null;
  const canImport = Boolean(preview?.ok) && valid.length > 0 && (preview as { errors: unknown[] }).errors?.length === 0 && !planMessage;

  return (
    <div className="space-y-5 pt-4">
      <Card className="space-y-4 p-5">
        <div>
          <h2 className="text-lg font-extrabold text-ink-900">Sube un archivo CSV</h2>
          <p className="mt-1 text-sm text-ink-500">
            Columnas: <span className="font-semibold">nombre</span> y{' '}
            <span className="font-semibold">precio</span> (obligatorias), más{' '}
            <span className="font-semibold">descripción</span>,{' '}
            <span className="font-semibold">categoría</span> y{' '}
            <span className="font-semibold">sección</span> (opcionales).
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            <FileUp className="size-4" aria-hidden />
            {fileName ? 'Cambiar archivo' : 'Elegir archivo'}
          </Button>
          <a
            href="/plantilla-menu.csv"
            download
            className="inline-flex h-11 items-center gap-2 rounded-lg border-[1.5px] border-ink-200 px-4 text-sm font-extrabold text-ink-700 transition-colors hover:bg-ink-50"
          >
            <Download className="size-4" aria-hidden />
            Descargar plantilla
          </a>
        </div>
        {fileName && <p className="text-sm text-ink-500">Archivo: {fileName}</p>}
      </Card>

      {preview && !preview.ok && (
        <Card className="flex items-start gap-3 border-rojo-200 bg-rojo-50 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rojo-600" aria-hidden />
          <div className="text-sm text-rojo-700">
            Faltan columnas obligatorias:{' '}
            <span className="font-semibold">
              {preview.missing.map((m) => HEADER_LABELS[m] ?? m).join(', ')}
            </span>
            . Revisa la primera fila (encabezados) de tu archivo.
          </div>
        </Card>
      )}

      {preview?.ok && preview.errors.length > 0 && (
        <Card className="border-rojo-200 bg-rojo-50 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-rojo-700">
            <AlertTriangle className="size-4" aria-hidden />
            {preview.errors.length} fila(s) con errores — corrígelas y vuelve a subir
          </p>
          <ul className="space-y-1 text-sm text-rojo-700">
            {preview.errors.slice(0, 20).map((error, i) => (
              <li key={i}>
                Fila {error.rowNumber}: {error.message}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {planMessage && (
        <Card className="flex items-start gap-3 border-mostaza-200 bg-mostaza-50 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-mostaza-600" aria-hidden />
          <p className="text-sm font-medium text-ink-700">{planMessage}</p>
        </Card>
      )}

      {preview?.ok && valid.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-bold text-ink-900">Vista previa ({valid.length} platillos)</p>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-ink-50 text-left text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-4 py-2 font-bold">Nombre</th>
                  <th className="px-4 py-2 font-bold">Precio</th>
                  <th className="px-4 py-2 font-bold">Categoría</th>
                  <th className="px-4 py-2 font-bold">Sección</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {valid.map((row, i) => {
                  const isDupe = existingNameSet.has(row.name.toLowerCase());
                  return (
                    <tr key={i}>
                      <td className="px-4 py-2 font-medium text-ink-900">
                        {row.name}
                        {isDupe && (
                          <span className="ml-2 rounded-full bg-mostaza-100 px-2 py-0.5 text-xs font-bold text-mostaza-700">
                            ya existe
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-ink-700">
                        ${(row.priceCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-ink-500">{row.categoryName ?? '—'}</td>
                      <td className="px-4 py-2 text-ink-500">{row.sectionName ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="sticky bottom-[88px] flex gap-3">
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          loading={isPending}
          disabled={!canImport}
          onClick={handleImport}
        >
          <Upload className="size-5" aria-hidden />
          Importar {valid.length > 0 ? `(${valid.length})` : ''}
        </Button>
      </div>
    </div>
  );
}
