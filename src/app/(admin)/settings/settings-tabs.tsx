'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { SegmentedControl } from '@/components/ui/segmented-control';
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
      <SegmentedControl
        value={active}
        options={tabs.map((tab) => ({
          value: tab.id,
          label: tab.label,
          icon: <span className={cn(active === tab.id && 'text-mostaza-600')}>{tab.icon}</span>,
        }))}
        onValueChange={setActive}
        ariaLabel="Secciones de ajustes"
        className="hidden w-full ipad-landscape:flex"
        buttonClassName="flex-1 py-2.5 font-semibold"
      />

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
