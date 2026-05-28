'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type SettingsTab = {
  id: string;
  label: string;
  icon: ReactNode;
  panel: ReactNode;
};

export function SettingsTabs({ tabs }: { tabs: SettingsTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div className="flex flex-col gap-8 ipad:gap-10 ipad-landscape:gap-7">
      <div
        role="tablist"
        aria-label="Secciones de ajustes"
        className="hidden gap-1 rounded-xl border border-ink-200 bg-ink-50 p-1 ipad-landscape:flex"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-white text-ink-900 shadow-sm ring-1 ring-ink-200'
                  : 'text-ink-500 hover:text-ink-800',
              )}
            >
              <span className={cn('inline-flex shrink-0', isActive && 'text-mostaza-600')}>
                {tab.icon}
              </span>
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          className={cn(
            tab.id === active ? 'ipad-landscape:block' : 'ipad-landscape:hidden',
          )}
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
