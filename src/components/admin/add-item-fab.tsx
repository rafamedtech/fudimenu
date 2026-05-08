'use client';
import { useRouter } from 'next/navigation';

export function AddItemFab({ sectionId }: { sectionId: string }) {
  const router = useRouter();
  return (
    <div className="fixed bottom-24 right-4">
      <button
        type="button"
        onClick={() => router.push(`/menu/new?sectionId=${sectionId}`)}
        className="flex h-14 items-center gap-2 rounded-full bg-mostaza-500 px-6 font-bold text-white shadow-lg"
      >
        Agregar platillo
      </button>
    </div>
  );
}
