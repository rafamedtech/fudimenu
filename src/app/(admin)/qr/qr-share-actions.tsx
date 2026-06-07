'use client';

import { Copy, Download, FileDown, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics/events';
import { getShareMenuUrlAction, markQrDownloadedAction } from './actions';

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function QrShareActions({
  menuUrl,
  qrImageUrl,
  downloadUrl,
  tenantId,
}: {
  menuUrl: string;
  qrImageUrl: string;
  downloadUrl: string;
  tenantId: string;
}) {
  async function copyMenuLink() {
    try {
      await copyText(menuUrl);
      track('qr_menu_link_copied', { tenantId });
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
        track('qr_menu_link_shared', { tenantId });
        return;
      }

      await copyText(result.url);
      track('qr_menu_link_copied', { tenantId });
      toast.success('Link copiado');
    } catch {
      toast.error('No pude compartir el link');
    }
  }

  async function markDownloaded() {
    try {
      const result = await markQrDownloadedAction();
      if (result.ok) return;
      toast.error('No pude actualizar el checklist de activación');
    } catch {
      toast.error('No pude actualizar el checklist de activación');
    }
  }

  async function downloadPdf() {
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Activa ventanas emergentes para descargar el PDF');
      return;
    }
    track('qr_downloaded', { tenantId, format: 'pdf' });
    win.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>QR</title>` +
        `<style>body{margin:2cm;display:flex;flex-direction:column;align-items:center;font-family:sans-serif}` +
        `img{width:280px;height:280px}.url{font-size:11px;word-break:break-all;max-width:280px;` +
        `text-align:center;margin-top:12px;color:#333}@media print{@page{margin:2cm}}</style></head>` +
        `<body><img src="${qrImageUrl}" onload="window.print()"/>` +
        `<p class="url">${menuUrl}</p></body></html>`,
    );
    win.document.close();
    void markDownloaded();
  }

  return (
    <div className="grid w-full grid-cols-2 gap-3">
      <Button type="button" variant="outline" onClick={copyMenuLink}>
        <Copy size={18} />
        Copiar
      </Button>
      <Button type="button" variant="outline" onClick={shareMenu}>
        <Share2 size={18} />
        Compartir
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          void markDownloaded();
          track('qr_downloaded', { tenantId, format: 'png' });
          window.location.href = downloadUrl;
        }}
      >
        <Download size={18} />
        PNG
      </Button>
      <Button type="button" onClick={downloadPdf}>
        <FileDown size={18} />
        PDF
      </Button>
    </div>
  );
}
