'use client';

import { Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getShareMenuUrlAction } from './actions';

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function QrShareActions({ menuUrl }: { menuUrl: string }) {
  async function copyMenuLink() {
    try {
      await copyText(menuUrl);
      toast.success('Link copiado');
    } catch {
      toast.error('No pude copiar el link');
    }
  }

  async function shareMenu() {
    const result = await getShareMenuUrlAction();
    if (!result.ok) {
      toast.error('No pude preparar el link');
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: result.title,
          text: 'Mira este menú en FudiMenu',
          url: result.url,
        });
        return;
      }

      await copyText(result.url);
      toast.success('Link copiado');
    } catch {
      toast.error('No pude compartir el link');
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button type="button" variant="outline" onClick={copyMenuLink}>
        <Copy size={18} />
        Copiar
      </Button>
      <Button type="button" variant="outline" onClick={shareMenu}>
        <Share2 size={18} />
        Compartir
      </Button>
    </div>
  );
}
