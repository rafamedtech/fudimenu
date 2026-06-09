'use client';

import { Lock, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { PLAN_CONFIG } from '@/config/plans';
import type { Plan } from '@/types/domain';

type PlanLimitBannerProps = {
  plan: Plan;
  itemCount: number;
  addHref?: string;
  addLabel?: string;
  sectionCount?: number;
  showFloatingAction?: boolean;
};

const FREE_ITEM_LIMIT = PLAN_CONFIG.free.limits.items ?? 20;
const FREE_SECTION_LIMIT = PLAN_CONFIG.free.limits.sections ?? 5;

export function PlanLimitBanner({
  plan,
  itemCount,
  addHref = '/menu/new',
  addLabel = 'Agregar platillo',
  sectionCount,
  showFloatingAction = true,
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
              <Sparkles className="size-5 shrink-0 text-mostaza-600" />
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
              <Sparkles className="size-5 shrink-0 text-mostaza-600" />
              <p className="text-sm font-extrabold text-ink-900">
                {remainingItems} items restantes en Free. Upgrade →
              </p>
            </div>
          </Card>
        </Link>
      )}

      {showFloatingAction && isAtItemLimit ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={addLabel}
          onClick={() => setIsUpgradeOpen(true)}
          className="fixed bottom-[88px] right-4 z-30 size-14 rounded-full bg-ink-900 text-mostaza-500 shadow-lg hover:scale-105 hover:bg-ink-900 ipad:bottom-[104px] ipad:right-[max(1rem,calc((100vw-744px)/2+1rem))] ipad-landscape:bottom-6 ipad-landscape:right-8"
        >
          <Lock size={24} strokeWidth={2.5} />
        </Button>
      ) : showFloatingAction ? (
        <Button asChild size="icon" className="fixed bottom-[88px] right-4 z-30 size-14 rounded-full shadow-lg hover:scale-105 ipad:bottom-[104px] ipad:right-[max(1rem,calc((100vw-744px)/2+1rem))] ipad-landscape:bottom-6 ipad-landscape:right-8">
          <Link href={addHref} aria-label={addLabel}>
            <Plus size={28} strokeWidth={2.5} />
          </Link>
        </Button>
      ) : null}

      {isUpgradeOpen && (
        <Dialog
          open={isUpgradeOpen}
          onOpenChange={setIsUpgradeOpen}
          title="Llegaste al límite Free"
          contentClassName="space-y-4"
        >
          <Card className="space-y-4 rounded-lg border-[1.5px] border-mostaza-500 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-mostaza-100 text-ink-900">
                <Lock className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-ink-900">
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
              <Button asChild type="button" className="flex-1">
                <Link href="/settings/billing">
                  Upgrade
                </Link>
              </Button>
            </div>
          </Card>
        </Dialog>
      )}
    </>
  );
}
