import { Suspense } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Eye,
  FilePlus2,
  Pencil,
  Sparkles,
  Trash2,
  User,
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
  MENU_AUDIT_ENTITY_TYPES,
  type MenuAuditAction,
  type MenuAuditEntity,
  type MenuHistoryEntry,
} from '@/server/services/audit.service';

// First-phase scope: simple undelete of items only. Full snapshots / versioned
// rollback of edits and of sections/categories are intentionally out of scope.

type FilterValue = MenuAuditEntity | 'all';

const FILTER_TABS: Array<{ value: FilterValue; label: string }> = [
  { value: 'all', label: 'Todo' },
  { value: 'menu_item', label: 'Platillos' },
  { value: 'section', label: 'Secciones' },
  { value: 'category', label: 'Categorías' },
];

function parseFilter(raw: string | undefined): FilterValue {
  return raw && MENU_AUDIT_ENTITY_TYPES.includes(raw as MenuAuditEntity)
    ? (raw as MenuAuditEntity)
    : 'all';
}

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

type MenuHistoryPageProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function MenuHistoryPage({ searchParams }: MenuHistoryPageProps) {
  const [{ type }, ctx] = await Promise.all([searchParams, requireAuth()]);
  const filter = parseFilter(type);

  return (
    <>
      <AppHeader
        title="Historial"
        showBack
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="flex-1 px-4 pb-24 ipad:px-6 ipad-landscape:px-7 desktop:px-8">
        <FilterTabs active={filter} />
        <Suspense key={filter} fallback={<HistoryLoading />}>
          <HistoryList tenantId={ctx.tenantId} filter={filter} />
        </Suspense>
      </main>
    </>
  );
}

function FilterTabs({ active }: { active: FilterValue }) {
  return (
    <nav className="mt-4 flex flex-wrap gap-2" aria-label="Filtrar historial por tipo">
      {FILTER_TABS.map((tab) => {
        const isActive = tab.value === active;
        const href = tab.value === 'all' ? '/menu/history' : `/menu/history?type=${tab.value}`;
        return (
          <Link
            key={tab.value}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`inline-flex h-9 items-center rounded-full border-[1.5px] px-4 text-sm font-extrabold transition-all ${
              isActive
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-faint)] text-[var(--brand-accent-text)]'
                : 'border-[var(--brand-card-border)] bg-[var(--brand-card)] text-ink-700 hover:border-[var(--brand-primary)]'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

async function HistoryList({ tenantId, filter }: { tenantId: string; filter: FilterValue }) {
  const [entries, restorableIds] = await Promise.all([
    listMenuHistory(tenantId, filter === 'all' ? {} : { entityType: filter }),
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
          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-ink-500">
            <User className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{entry.actor.label}</span>
            <span aria-hidden>·</span>
            <span className="shrink-0">{DATE_FORMATTER.format(entry.createdAt)}</span>
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
