'use client';
import { useRouter } from 'next/navigation';

export function AddItemFab({ sectionId }: { sectionId: string }) {
  const router = useRouter();
  return (
    <div className="fixed bottom-[88px] right-4 z-30 ipad:bottom-[104px] ipad-landscape:bottom-6 ipad-landscape:right-8">
      <button
        type="button"
        onClick={() => router.push(`/menu/new?sectionId=${sectionId}`)}
        className="flex h-14 items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 font-bold text-[var(--brand-on-primary)] shadow-lg"
      >
        Agregar platillo
      </button>
    </div>
  );
}
