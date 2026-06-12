'use client';

import { Eye, ExternalLink, PanelRightClose, PanelRightOpen, X } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MENU_PREVIEW_REFRESH_EVENT } from '@/lib/menu-preview';

const DESKTOP_OPEN_KEY = 'fudi:menu-preview-open';
const DESKTOP_MEDIA_QUERY = '(min-width: 1280px)';

interface PreviewTarget {
  inScope: boolean;
  anchor: string | null;
}

// Mapea la ruta del admin al ancla del menú público (ids: sec-, cat-, item-).
function computeTarget(pathname: string): PreviewTarget {
  if (pathname === '/settings/brand' || pathname === '/settings/contact') {
    return { inScope: true, anchor: null };
  }
  if (!pathname.startsWith('/menu')) return { inScope: false, anchor: null };
  if (
    pathname === '/menu' ||
    pathname === '/menu/history' ||
    pathname === '/menu/import' ||
    pathname === '/menu/new' ||
    pathname === '/menu/sections/new' ||
    pathname === '/menu/categories/new'
  ) {
    return { inScope: true, anchor: null };
  }
  const section =
    pathname.match(/^\/menu\/s\/([^/]+)$/) ?? pathname.match(/^\/menu\/sections\/([^/]+)\/edit$/);
  if (section) return { inScope: true, anchor: `sec-${section[1]}` };
  const category = pathname.match(/^\/menu\/categories\/([^/]+)\/edit$/);
  if (category) return { inScope: true, anchor: `cat-${category[1]}` };
  const item = pathname.match(/^\/menu\/([^/]+)$/);
  if (item) return { inScope: true, anchor: `item-${item[1]}` };
  return { inScope: false, anchor: null };
}

export function MenuPreviewPanel({ slug }: { slug: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const saved = searchParams.get('saved');
  const { inScope, anchor } = computeTarget(pathname);

  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const anchorRef = useRef(anchor);
  anchorRef.current = anchor;

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem(DESKTOP_OPEN_KEY) === '0') setDesktopOpen(false);
  }, []);

  const setDesktopOpenPersisted = useCallback((open: boolean) => {
    setDesktopOpen(open);
    window.localStorage.setItem(DESKTOP_OPEN_KEY, open ? '1' : '0');
  }, []);

  // Posiciona el iframe en lo que se está editando (sección/categoría/platillo).
  const scrollToTarget = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      const target = anchorRef.current;
      if (target) {
        const el = win.document.getElementById(target);
        if (el) el.scrollIntoView({ block: 'start' });
        else win.location.hash = target;
      } else {
        win.scrollTo(0, 0);
      }
    } catch {
      // iframe aún sin documento accesible; el próximo load lo reintenta.
    }
  }, []);

  useEffect(() => {
    scrollToTarget();
  }, [anchor, scrollToTarget]);

  const reloadFrame = useCallback(() => {
    try {
      iframeRef.current?.contentWindow?.location.reload();
    } catch {
      if (iframeRef.current) iframeRef.current.src = `/m/${slug}`;
    }
  }, [slug]);

  // Formularios client avisan vía evento tras guardar.
  useEffect(() => {
    window.addEventListener(MENU_PREVIEW_REFRESH_EVENT, reloadFrame);
    return () => window.removeEventListener(MENU_PREVIEW_REFRESH_EVENT, reloadFrame);
  }, [reloadFrame]);

  // Forms server-action (brand/contact) redirigen con ?saved=1.
  useEffect(() => {
    if (saved) reloadFrame();
  }, [saved, reloadFrame]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  if (!inScope || !slug || isDesktop === null) return null;

  const previewUrl = `/m/${slug}`;

  const frame = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--brand-card-border)] px-3 py-2">
        <p className="text-sm font-bold text-ink-900">Vista previa</p>
        <div className="flex items-center gap-1">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir menú público en pestaña nueva"
            className="rounded-md p-2 text-ink-500 hover:bg-[var(--brand-surface)] hover:text-ink-900"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
          {isDesktop ? (
            <button
              type="button"
              onClick={() => setDesktopOpenPersisted(false)}
              aria-label="Ocultar vista previa"
              className="rounded-md p-2 text-ink-500 hover:bg-[var(--brand-surface)] hover:text-ink-900"
            >
              <PanelRightClose className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Cerrar vista previa"
              className="rounded-md p-2 text-ink-500 hover:bg-[var(--brand-surface)] hover:text-ink-900"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
      <iframe
        ref={iframeRef}
        src={previewUrl}
        title="Vista previa del menú público"
        onLoad={scrollToTarget}
        className="min-h-0 w-full flex-1 bg-[var(--brand-surface)]"
      />
    </div>
  );

  if (isDesktop) {
    if (!desktopOpen) {
      return (
        <button
          type="button"
          onClick={() => setDesktopOpenPersisted(true)}
          aria-label="Mostrar vista previa del menú"
          className="fixed right-0 top-1/2 z-30 flex -translate-y-1/2 items-center gap-2 rounded-l-xl border border-r-0 border-[var(--brand-card-border)] bg-[var(--brand-card)] px-2 py-4 text-ink-500 shadow-md hover:text-ink-900"
        >
          <PanelRightOpen className="h-5 w-5" aria-hidden />
        </button>
      );
    }
    return (
      <aside
        aria-label="Vista previa del menú público"
        className="sticky top-0 h-dvh w-[380px] shrink-0 border-l border-[var(--brand-card-border)] bg-[var(--brand-card)]"
      >
        {frame}
      </aside>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Ver vista previa del menú"
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--brand-card-border)] bg-[var(--brand-card)] text-ink-900 shadow-lg ipad-landscape:bottom-6"
      >
        <Eye className="h-5 w-5" aria-hidden />
      </button>
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar vista previa"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Vista previa del menú público"
            className="absolute inset-y-0 right-0 w-[min(92vw,420px)] bg-[var(--brand-card)] shadow-2xl"
          >
            {frame}
          </div>
        </div>
      )}
    </>
  );
}
