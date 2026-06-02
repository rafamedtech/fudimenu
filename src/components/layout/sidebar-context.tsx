'use client';
import { createContext, use, useCallback, useMemo, useSyncExternalStore } from 'react';

type SidebarState = 'expanded' | 'collapsed';

type SidebarContextType = {
  state: SidebarState;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebarContext() {
  const ctx = use(SidebarContext);
  if (!ctx) throw new Error('useSidebarContext must be used within SidebarProvider');
  return ctx;
}

const STORAGE_KEY = 'fudimenu:sidebar-open';
const SIDEBAR_STATE_EVENT = 'fudimenu:sidebar-state';

function subscribeToSidebarState(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(SIDEBAR_STATE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(SIDEBAR_STATE_EVENT, onStoreChange);
  };
}

function getStoredSidebarState(defaultOpen: boolean) {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? defaultOpen : stored === 'true';
  } catch {
    return defaultOpen;
  }
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const getSnapshot = useCallback(() => getStoredSidebarState(defaultOpen), [defaultOpen]);
  const getServerSnapshot = useCallback(() => defaultOpen, [defaultOpen]);
  const isOpen = useSyncExternalStore(subscribeToSidebarState, getSnapshot, getServerSnapshot);

  const setIsOpen = useCallback((open: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(open));
    } catch {}
    window.dispatchEvent(new Event(SIDEBAR_STATE_EVENT));
  }, []);

  const toggleSidebar = useCallback(() => setIsOpen(!isOpen), [isOpen, setIsOpen]);
  const value = useMemo(
    () => ({
      state: isOpen ? 'expanded' as const : 'collapsed' as const,
      isOpen,
      setIsOpen,
      toggleSidebar,
    }),
    [isOpen, setIsOpen, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}
