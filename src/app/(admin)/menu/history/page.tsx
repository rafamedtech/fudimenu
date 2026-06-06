import { Suspense } from 'react';
import {
  CheckCircle2,
  Eye,
  FilePlus2,
  Pencil,
  Sparkles,
  Trash2,
  ArrowUpDown,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { RestoreItemButton } from '@/components/admin/restore-item-button';
import { EmptyState } from '@/components/ui/empty-state';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { requireAuth } from '@/server/guards/require-auth';
import {
  listMenuHistory,
  listRestorableItemIds,
  type MenuAuditAction,
  type MenuHistoryEntry,
} from '@/server/services/audit.service';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const ACTION_META: Record<MenuAuditAction, { label: string; icon: LucideIcon }> = {
  'item.created': { label: 'Platillo creado', icon: FilePlus2 },
  'item.updated': { label: 'Platillo editado', icon: Pencil },
  'item.deleted': { label: 'Platillo eliminado', icon: Trash2 },
  'item.restored': { label: 'Platillo restaurado', icon: RotateCcw },
  'item.availability_changed': { label: 'Disponibilidad cambiada', icon: Eye },
  'item.special_changed': { label: 'Especial del día', icon: Sparkles },
  'section.created': { label: 'Sección creada', icon: FilePlus2 },
  'section.updated': { label: 'Sección editada', icon: Pencil },
  'section.deleted': { label: 'Sección eliminada', icon: Trash2 },
  'section.reordered': { label: 'Secciones reordenadas', icon: ArrowUpDown },
  'category.created': { label: 'Categoría creada', icon: FilePlus2 },
  'category.updated': { label: 'Categoría editada', icon: Pencil },
  'category.deleted': { label: 'Categoría eliminada', icon: Trash2 },
  'category.reordered': { label: 'Categorías reordenadas', icon: ArrowUpDown },
};

export default async function MenuHistoryPage() {
  const ctx = await requireAuth();

  return (
    <>
      <AppHeader
        title="Historial"
        showBack
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="flex-1 px-4 pb-24 ipad:px-6 ipad-landscape:px-7 desktop:px-8">
        <Suspense fallback={<HistoryLoading />}>
          <HistoryList tenantId={ctx.tenantId} />
        </Suspense>
      </main>
    </>
  );
}

async function HistoryList({ tenantId }: { tenantId: string }) {
  const [entries, restorableIds] = await Promise.all([
    listMenuHistory(tenantId),
    listRestorableItemIds(tenantId),
  ]);

  if (entries.length === 0) {
    return (
      <EmptyState
        emoji="🕘"
        title="Sin cambios todavía"
        description="Aquí verás el historial de cambios en tu menú: platillos, secciones y categorías que crees, edites o elimines."
      />
    );
  }

  return (
    <ul className="mt-4 flex flex-col gap-2">
      {entries.map((entry) => (
        <HistoryRow
          key={entry.id}
          entry={entry}
          canRestore={
            entry.action === 'item.deleted' &&
            entry.entityId !== null &&
            restorableIds.has(entry.entityId)
          }
        />
      ))}
    </ul>
  );
}

function HistoryRow({ entry, canRestore }: { entry: MenuHistoryEntry; canRestore: boolean }) {
  const meta = ACTION_META[entry.action];
  const Icon = meta?.icon ?? CheckCircle2;

  return (
    <li>
      <Card className="flex items-center gap-3 p-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[var(--brand-primary-faint)] text-[var(--brand-accent-text)]">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-ink-900">
            {meta?.label ?? entry.action}
            {entry.name ? <span className="font-medium text-ink-600"> · {entry.name}</span> : null}
          </p>
          <p className="mt-0.5 text-xs font-medium text-ink-500">
            {DATE_FORMATTER.format(entry.createdAt)}
          </p>
        </div>
        {canRestore && entry.entityId ? <RestoreItemButton itemId={entry.entityId} /> : null}
      </Card>
    </li>
  );
}

function HistoryLoading() {
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i}>
          <Card className="flex items-center gap-3 p-3">
            <Skeleton className="size-9 shrink-0 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48 max-w-[70%]" />
              <Skeleton className="h-3 w-24" />
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
