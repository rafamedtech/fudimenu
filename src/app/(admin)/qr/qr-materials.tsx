'use client';

import { useState } from 'react';
import { Download, Printer, Share2, Sticker } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { track } from '@/lib/analytics/events';

type MaterialType = 'poster' | 'sticker' | 'social';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : { r: 244, g: 180, b: 0 };
}

function rrp(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

async function generatePoster(
  qrImageUrl: string,
  tenantName: string,
  menuUrl: string,
  primaryColor: string,
): Promise<Blob> {
  const W = 794, H = 1123;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FFFCF5';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, W, 14);
  ctx.fillRect(0, H - 14, W, 14);

  ctx.fillStyle = '#1A1611';
  ctx.textAlign = 'center';
  ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
  ctx.fillText(tenantName, W / 2, 130, W - 80);

  ctx.fillStyle = '#6B5E4A';
  ctx.font = '26px system-ui, -apple-system, sans-serif';
  ctx.fillText('Escanea y ve nuestro menú digital', W / 2, 186, W - 80);

  const qrSize = 500;
  const qrX = (W - qrSize) / 2;
  const qrY = 228;
  const pad = 24;

  ctx.save();
  ctx.shadowColor = 'rgba(26, 22, 17, 0.10)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#FFFFFF';
  rrp(ctx, qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 20);
  ctx.fill();
  ctx.restore();

  const qrImg = await loadImage(qrImageUrl);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = '#6B5E4A';
  ctx.font = '20px monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(menuUrl, W / 2, 840, W - 80);

  ctx.fillStyle = primaryColor;
  ctx.fillRect(W / 2 - 24, 860, 48, 3);

  ctx.fillStyle = '#9B8E7B';
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.fillText('Creado con FudiMenu', W / 2, H - 38);

  return canvasToBlob(canvas);
}

async function generateSticker(
  qrImageUrl: string,
  tenantName: string,
  menuUrl: string,
  primaryColor: string,
): Promise<Blob> {
  const S = 500;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  const cx = S / 2, cy = S / 2, r = S / 2 - 1;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = '#FFFCF5';
  ctx.fillRect(0, 0, S, S);

  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 9, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = primaryColor + '30';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 26, 0, Math.PI * 2);
  ctx.stroke();

  const qrSize = 280;
  const qrImg = await loadImage(qrImageUrl);
  ctx.drawImage(qrImg, (S - qrSize) / 2, (S - qrSize) / 2 + 14, qrSize, qrSize);

  ctx.fillStyle = '#1A1611';
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.fillText(tenantName, cx, 66, S - 70);

  ctx.fillStyle = '#6B5E4A';
  ctx.font = '15px monospace, monospace';
  ctx.fillText(menuUrl, cx, S - 42, S - 70);

  ctx.restore();

  return canvasToBlob(canvas);
}

async function generateSocial(
  qrImageUrl: string,
  tenantName: string,
  menuUrl: string,
  primaryColor: string,
): Promise<Blob> {
  const S = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, '#1A1611');
  grad.addColorStop(1, '#2D2418');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  const { r, g, b } = hexToRgb(primaryColor);
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.08)`;
  for (let px = 30; px < S; px += 48) {
    for (let py = 30; py < S; py += 48) {
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, S, 10);

  const qrSize = 500;
  const qrX = (S - qrSize) / 2;
  const qrY = 240;
  const pad = 28;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.30)';
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#FFFFFF';
  rrp(ctx, qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 24);
  ctx.fill();
  ctx.restore();

  const qrImg = await loadImage(qrImageUrl);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = '#FFFCF5';
  ctx.textAlign = 'center';
  ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
  ctx.fillText(tenantName, S / 2, 178, S - 80);

  ctx.fillStyle = primaryColor;
  ctx.fillRect(S / 2 - 32, 870, 64, 4);

  ctx.fillStyle = 'rgba(255, 252, 245, 0.85)';
  ctx.font = '36px system-ui, -apple-system, sans-serif';
  ctx.fillText('Escanea para ver nuestro menú', S / 2, 920, S - 80);

  ctx.fillStyle = 'rgba(255, 252, 245, 0.55)';
  ctx.font = '24px monospace, monospace';
  ctx.fillText(menuUrl, S / 2, 970, S - 80);

  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillText('FudiMenu', S / 2, 1038);

  return canvasToBlob(canvas);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('canvas_to_blob_failed'))), 'image/png'),
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const MATERIALS: {
  type: MaterialType;
  label: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  { type: 'poster', label: 'Cartel A4', desc: 'Imprime y pega en mesas o mostrador.', icon: Printer },
  { type: 'sticker', label: 'Sticker', desc: 'Redondo, para empaques o tarjetas.', icon: Sticker },
  { type: 'social', label: 'Para redes', desc: '1080 × 1080 px para Instagram o WhatsApp.', icon: Share2 },
];

export function QrMaterials({
  qrImageUrl,
  tenantName,
  menuUrl,
  tenantSlug,
  primaryColor,
  tenantId,
}: {
  qrImageUrl: string;
  tenantName: string;
  menuUrl: string;
  tenantSlug: string;
  primaryColor: string;
  tenantId: string;
}) {
  const [loading, setLoading] = useState<MaterialType | null>(null);

  async function handleDownload(type: MaterialType) {
    setLoading(type);
    try {
      let blob: Blob;
      if (type === 'poster') blob = await generatePoster(qrImageUrl, tenantName, menuUrl, primaryColor);
      else if (type === 'sticker') blob = await generateSticker(qrImageUrl, tenantName, menuUrl, primaryColor);
      else blob = await generateSocial(qrImageUrl, tenantName, menuUrl, primaryColor);

      downloadBlob(blob, `${type}-${tenantSlug}.png`);
      track('material_downloaded', { tenantId, material: type });
    } catch {
      toast.error('No pude generar el material, intenta de nuevo');
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card className="ipad:p-6 ipad-landscape:p-7">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-black uppercase tracking-wider text-ink-500">
          Materiales descargables
        </p>
        <span className="text-[11px] font-semibold text-ink-300">PNG · listo para usar</span>
      </div>
      <ul className="mt-4 grid gap-3 ipad-landscape:grid-cols-3">
        {MATERIALS.map(({ type, label, desc, icon: Icon }) => (
          <li
            key={type}
            className="flex flex-col gap-3 rounded-md border border-ink-100 bg-[var(--brand-surface)] p-4"
          >
            <span className="inline-flex size-9 items-center justify-center rounded-md bg-mostaza-50 text-mostaza-700">
              <Icon size={18} strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-sm font-bold text-ink-900">{label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{desc}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-auto w-full"
              disabled={loading !== null}
              onClick={() => handleDownload(type)}
            >
              <Download size={14} />
              {loading === type ? 'Generando…' : 'Descargar'}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
