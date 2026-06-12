export const MENU_PREVIEW_REFRESH_EVENT = 'fudi:menu-preview-refresh';

/** Avisa al panel de vista previa que el menú público cambió (tras guardar). */
export function refreshMenuPreview() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(MENU_PREVIEW_REFRESH_EVENT));
}
