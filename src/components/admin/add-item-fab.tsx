'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function AddItemFab({ sectionId }: { sectionId: string }) {
  const router = useRouter();
  return (
    <div className="fixed bottom-[88px] right-4 z-30 ipad:bottom-[104px] ipad-landscape:bottom-6 ipad-landscape:right-8">
      <Button
        type="button"
        size="lg"
        onClick={() => router.push(`/menu/new?sectionId=${sectionId}`)}
        className="h-14 rounded-full px-6 font-bold shadow-lg"
      >
        Agregar platillo
      </Button>
    </div>
  );
}
