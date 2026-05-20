'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type SidebarState = 'expanded' | 'collapsed';

type SidebarContextType = {
  state: SidebarState;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebarContext() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebarContext must be used within SidebarProvider');
  return ctx;
}

const STORAGE_KEY = 'fudimenu:sidebar-open';

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpenState] = useState(defaultOpen);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setIsOpenState(stored === 'true');
    } catch {}
  }, []);

  const setIsOpen = (open: boolean) => {
    setIsOpenState(open);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(open));
    } catch {}
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <SidebarContext.Provider
      value={{
        state: isOpen ? 'expanded' : 'collapsed',
        isOpen,
        setIsOpen,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
