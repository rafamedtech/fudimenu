'use client';

import { Lock, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PLAN_CONFIG } from '@/config/plans';
import { cn } from '@/lib/utils';
import type { Plan } from '@/types/domain';

type PlanLimitBannerProps = {
  plan: Plan;
  itemCount: number;
  addHref?: string;
  sectionCount?: number;
};

const FREE_ITEM_LIMIT = PLAN_CONFIG.free.limits.items ?? 20;
const FREE_SECTION_LIMIT = PLAN_CONFIG.free.limits.sections ?? 5;

export function PlanLimitBanner({
  plan,
  itemCount,
  addHref = '/menu/new',
  sectionCount,
}: PlanLimitBannerProps) {
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const isFree = plan === 'free';
  const remainingItems = Math.max(FREE_ITEM_LIMIT - itemCount, 0);
  const isAtItemLimit = isFree && remainingItems === 0;
  const shouldWarn = isFree && remainingItems > 0 && remainingItems <= 2;
  const isAtSectionLimit = isFree && sectionCount !== undefined && sectionCount >= FREE_SECTION_LIMIT;

  return (
    <>
      {isAtSectionLimit && (
        <Link href="/settings/billing" className="mb-4 block">
          <Card className="border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 shrink-0 text-mostaza-600" />
              <p className="text-sm font-extrabold text-ink-900">
                Límite de {FREE_SECTION_LIMIT} secciones en Free alcanzado. Upgrade →
              </p>
            </div>
          </Card>
        </Link>
      )}

      {shouldWarn && (
        <Link href="/settings/billing" className="mb-4 block">
          <Card className="border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 shrink-0 text-mostaza-600" />
              <p className="text-sm font-extrabold text-ink-900">
                {remainingItems} items restantes en Free. Upgrade →
              </p>
            </div>
          </Card>
        </Link>
      )}

      {isAtItemLimit ? (
        <button
          type="button"
          aria-label="Agregar platillo"
          onClick={() => setIsUpgradeOpen(true)}
          className={cn(
            'fixed bottom-[88px] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-mostaza-500 shadow-lg transition-transform active:scale-90 hover:scale-105',
          )}
        >
          <Lock size={24} strokeWidth={2.5} />
        </button>
      ) : (
        <Link
          href={addHref}
          aria-label="Agregar platillo"
          className="fixed bottom-[88px] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[var(--brand-on-primary)] shadow-lg transition-transform active:scale-90 hover:scale-105"
        >
          <Plus size={28} strokeWidth={2.5} />
        </Link>
      )}

      {isUpgradeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-ink-900/45 px-4 pb-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-limit-title"
        >
          <Card className="w-full space-y-4 rounded-lg border-[1.5px] border-mostaza-500 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-mostaza-100 text-ink-900">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 id="upgrade-limit-title" className="text-lg font-extrabold text-ink-900">
                  Llegaste al límite Free
                </h2>
                <p className="mt-1 text-sm leading-6 text-ink-700">
                  Tu menú ya tiene {FREE_ITEM_LIMIT} platillos. Sube a Pro para agregar items
                  ilimitados, quitar la marca FudiMenu y activar analytics básico.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsUpgradeOpen(false)}
              >
                Ahora no
              </Button>
              <Link href="/settings/billing" className="flex-1">
                <Button type="button" className="w-full">
                  Upgrade
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
