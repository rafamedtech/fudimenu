'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Download, FileUp, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { isCsvFile, parseCsv } from '@/lib/import/csv';
import {
  mapRows,
  parsePrice,
  type ImportItem,
  type ImportRowError,
} from '@/lib/import/menu-import';
import { importItemSchema } from '@/lib/validators/import.schema';
import { importMenuAction } from '@/server/actions/import.actions';

const HEADER_LABELS: Record<string, string> = { name: 'nombre', price: 'precio' };

/** Editable row: every field is a string while the user edits; parsed on confirm. */
type DraftRow = {
  id: string;
  name: string;
  description: string;
  price: string;
  categoryName: string;
  sectionName: string;
};

/** A draft turned into a validated item, or the per-field errors blocking it. */
type RowState = {
  draft: DraftRow;
  item: ImportItem | null;
  fieldErrors: Partial<Record<keyof DraftRow, string>>;
};

interface MenuImporterProps {
  existingItemNames: string[];
  existingSectionNames: string[];
  itemLimit: number | null;
  sectionLimit: number | null;
  currentItemCount: number;
}

let draftSeq = 0;
function toDraft(item: ImportItem): DraftRow {
  draftSeq += 1;
  return {
    id: `row-${draftSeq}`,
    name: item.name,
    description: item.description ?? '',
    price: String(item.priceCents / 100),
    categoryName: item.categoryName ?? '',
    sectionName: item.sectionName ?? '',
  };
}

/** Validate one draft row, mirroring the server's `importItemSchema` pass. */
function validateDraft(draft: DraftRow): RowState {
  const priceCents = parsePrice(draft.price);
  const fieldErrors: Partial<Record<keyof DraftRow, string>> = {};

  if (priceCents === null) {
    fieldErrors.price = 'Precio inválido o vacío';
  }

  const candidate = {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    priceCents: priceCents ?? 0,
    categoryName: draft.categoryName.trim() || null,
    sectionName: draft.sectionName.trim() || null,
  };

  const parsed = importItemSchema.safeParse(candidate);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      const field: keyof DraftRow =
        key === 'priceCents'
          ? 'price'
          : key === 'categoryName'
            ? 'categoryName'
            : key === 'sectionName'
              ? 'sectionName'
              : key === 'description'
                ? 'description'
                : 'name';
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
  }

  const hasErrors = Object.keys(fieldErrors).length > 0;
  return { draft, item: hasErrors || !parsed.success ? null : parsed.data, fieldErrors };
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
  const [missingHeaders, setMissingHeaders] = useState<string[] | null>(null);
  const [skipped, setSkipped] = useState<ImportRowError[]>([]);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [isPending, startTransition] = useTransition();

  const existingNameSet = useMemo(
    () => new Set(existingItemNames.map((n) => n.toLowerCase())),
    [existingItemNames],
  );

  function resetPreview() {
    setMissingHeaders(null);
    setSkipped([]);
    setDrafts([]);
  }

  async function handleFile(file: File) {
    if (!isCsvFile(file)) {
      toast.error('Por ahora solo aceptamos archivos CSV. PDF, Excel e imágenes llegarán después.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    const text = await file.text();
    setFileName(file.name);
    const result = mapRows(parseCsv(text));

    if (!result.ok) {
      resetPreview();
      setMissingHeaders(result.missing);
      return;
    }

    setMissingHeaders(null);
    setSkipped(result.errors);
    setDrafts(result.valid.map(toDraft));
  }

  function updateDraft(id: string, field: keyof DraftRow, value: string) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }

  function removeDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  const rowStates = useMemo(() => drafts.map(validateDraft), [drafts]);
  const validItems = rowStates.filter((r) => r.item !== null).map((r) => r.item as ImportItem);
  const invalidCount = rowStates.length - validItems.length;

  const planMessage = useMemo(() => {
    if (itemLimit !== null && currentItemCount + validItems.length > itemLimit) {
      return `Tu plan permite ${itemLimit} platillos. Este lote los excede.`;
    }
    if (sectionLimit !== null) {
      const existing = new Set(existingSectionNames);
      const newSections = new Set(
        validItems
          .map((r) => r.sectionName)
          .filter((s): s is string => s !== null && !existing.has(s)),
      );
      if (existing.size + newSections.size > sectionLimit) {
        return `Tu plan permite ${sectionLimit} secciones. Este lote las excede.`;
      }
    }
    return null;
  }, [validItems, itemLimit, sectionLimit, currentItemCount, existingSectionNames]);

  const canImport =
    validItems.length > 0 && invalidCount === 0 && !planMessage && !isPending;

  function handleImport() {
    startTransition(async () => {
      const result = await importMenuAction({ rows: validItems });
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
          toast.error('El lote es demasiado grande (máx 500 filas).');
          break;
        case 'validation':
          toast.error('Revisa las filas marcadas antes de importar.');
          break;
        default:
          toast.error('No se pudo iniciar sesión. Vuelve a entrar.');
      }
    });
  }

  const cellControlClass = 'h-10 border px-3';
  const cellInputClass = 'text-sm font-medium';

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
            <span className="font-semibold">sección</span> (opcionales). Solo CSV por ahora.
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

      {missingHeaders && (
        <Card className="flex items-start gap-3 border-rojo-200 bg-rojo-50 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rojo-600" aria-hidden />
          <div className="text-sm text-rojo-700">
            Faltan columnas obligatorias:{' '}
            <span className="font-semibold">
              {missingHeaders.map((m) => HEADER_LABELS[m] ?? m).join(', ')}
            </span>
            . Revisa la primera fila (encabezados) de tu archivo.
          </div>
        </Card>
      )}

      {skipped.length > 0 && (
        <Card className="border-mostaza-200 bg-mostaza-50 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-mostaza-700">
            <AlertTriangle className="size-4" aria-hidden />
            {skipped.length} fila(s) omitidas por errores — el resto se puede importar
          </p>
          <ul className="space-y-1 text-sm text-mostaza-700">
            {skipped.slice(0, 20).map((error, i) => (
              <li key={i}>
                Fila {error.rowNumber}: {error.message}
              </li>
            ))}
            {skipped.length > 20 && <li>…y {skipped.length - 20} más</li>}
          </ul>
        </Card>
      )}

      {planMessage && (
        <Card className="flex items-start gap-3 border-mostaza-200 bg-mostaza-50 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-mostaza-600" aria-hidden />
          <p className="text-sm font-medium text-ink-700">{planMessage}</p>
        </Card>
      )}

      {drafts.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-bold text-ink-900">
              Vista previa ({validItems.length} listas
              {invalidCount > 0 ? `, ${invalidCount} con errores` : ''})
            </p>
            <p className="text-xs text-ink-500">Edita o elimina filas antes de importar</p>
          </div>
          <div className="max-h-[520px] space-y-3 overflow-auto p-4">
            {rowStates.map(({ draft, fieldErrors }) => {
              const isDupe = existingNameSet.has(draft.name.trim().toLowerCase());
              return (
                <div
                  key={draft.id}
                  className={cn(
                    'grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-12',
                    Object.keys(fieldErrors).length > 0
                      ? 'border-rojo-300 bg-rojo-50'
                      : 'border-ink-100',
                  )}
                >
                  <div className="sm:col-span-3">
                    <Input
                      aria-label="Nombre"
                      value={draft.name}
                      placeholder="Nombre"
                      onChange={(e) => updateDraft(draft.id, 'name', e.target.value)}
                      controlClassName={cn(cellControlClass, fieldErrors.name ? 'border-rojo-400' : 'border-ink-200')}
                      className={cellInputClass}
                    />
                    {fieldErrors.name && (
                      <p className="mt-1 text-xs text-rojo-600">{fieldErrors.name}</p>
                    )}
                    {isDupe && !fieldErrors.name && (
                      <p className="mt-1 text-xs font-bold text-mostaza-700">ya existe</p>
                    )}
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      aria-label="Descripción"
                      value={draft.description}
                      placeholder="Descripción"
                      onChange={(e) => updateDraft(draft.id, 'description', e.target.value)}
                      controlClassName={cn(cellControlClass, fieldErrors.description ? 'border-rojo-400' : 'border-ink-200')}
                      className={cellInputClass}
                    />
                    {fieldErrors.description && (
                      <p className="mt-1 text-xs text-rojo-600">{fieldErrors.description}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      aria-label="Precio"
                      inputMode="decimal"
                      value={draft.price}
                      placeholder="Precio"
                      onChange={(e) => updateDraft(draft.id, 'price', e.target.value)}
                      controlClassName={cn(cellControlClass, fieldErrors.price ? 'border-rojo-400' : 'border-ink-200')}
                      className={cellInputClass}
                    />
                    {fieldErrors.price && (
                      <p className="mt-1 text-xs text-rojo-600">{fieldErrors.price}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      aria-label="Categoría"
                      value={draft.categoryName}
                      placeholder="Categoría"
                      onChange={(e) => updateDraft(draft.id, 'categoryName', e.target.value)}
                      controlClassName={cn(cellControlClass, fieldErrors.categoryName ? 'border-rojo-400' : 'border-ink-200')}
                      className={cellInputClass}
                    />
                    {fieldErrors.categoryName && (
                      <p className="mt-1 text-xs text-rojo-600">{fieldErrors.categoryName}</p>
                    )}
                  </div>
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <Input
                      aria-label="Sección"
                      value={draft.sectionName}
                      placeholder="Sección"
                      onChange={(e) => updateDraft(draft.id, 'sectionName', e.target.value)}
                      controlClassName={cn(cellControlClass, fieldErrors.sectionName ? 'border-rojo-400' : 'border-ink-200')}
                      className={cellInputClass}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Eliminar fila"
                      onClick={() => removeDraft(draft.id)}
                      className="size-10 shrink-0 border-ink-200 text-ink-500 hover:border-rojo-300 hover:text-rojo-600"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              );
            })}
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
          Importar {validItems.length > 0 ? `(${validItems.length})` : ''}
        </Button>
      </div>
    </div>
  );
}
