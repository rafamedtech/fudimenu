'use client';

import { useState } from 'react';
import { Download, Instagram, Printer, Share2, Smartphone, Sticker } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { track } from '@/lib/analytics/events';
import type { LogoShape } from '@/types/domain';

type MaterialType = 'poster' | 'sticker' | 'social-post' | 'social-story';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Logo is optional and may be cross-origin / 404 / blocked by CORS. A failed
// logo must never abort the whole material, so swallow the error and render
// without it.
async function tryLoadImage(src: string | null): Promise<HTMLImageElement | null> {
  if (!src) return null;
  try {
    return await loadImage(src);
  } catch {
    return null;
  }
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
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
}

// Draws the logo centered at `centerX`, top edge at `topY`, fit inside
// maxW × maxH preserving aspect ratio. `plate` draws a white backing so the
// logo stays legible over dark social backgrounds. Returns drawn height so
// callers can advance their layout cursor.
function drawLogo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  centerX: number,
  topY: number,
  maxW: number,
  maxH: number,
  shape: LogoShape,
  plate: boolean,
): number {
  const ratio = Math.min(maxW / img.width, maxH / img.height);
  const w = img.width * ratio;
  const h = img.height * ratio;
  const x = centerX - w / 2;

  if (plate) {
    const p = 16;
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    rrp(ctx, x - p, topY - p, w + p * 2, h + p * 2, shape === 'round' ? (Math.max(w, h) / 2 + p) : 18);
    ctx.fill();
    ctx.restore();
  }

  if (shape === 'round') {
    const rr = Math.min(w, h) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, topY + h / 2, rr, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, centerX - rr, topY + h / 2 - rr, rr * 2, rr * 2);
    ctx.restore();
  } else {
    ctx.drawImage(img, x, topY, w, h);
  }

  return h;
}

type GenInput = {
  qrImageUrl: string;
  tenantName: string;
  menuUrl: string;
  primaryColor: string;
  logoUrl: string | null;
  logoShape: LogoShape;
};

// A4 portrait at 96 DPI (794 × 1123). Light background, print-friendly.
async function generatePoster({
  qrImageUrl, tenantName, menuUrl, primaryColor, logoUrl, logoShape,
}: GenInput): Promise<Blob> {
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

  let y = 88;
  const logo = await tryLoadImage(logoUrl);
  if (logo) {
    const lh = drawLogo(ctx, logo, W / 2, y, 280, 96, logoShape, false);
    y += lh + 30;
  }

  ctx.fillStyle = '#1A1611';
  ctx.textAlign = 'center';
  ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
  y += 50;
  ctx.fillText(tenantName, W / 2, y, W - 80);

  ctx.fillStyle = '#6B5E4A';
  ctx.font = '26px system-ui, -apple-system, sans-serif';
  y += 46;
  ctx.fillText('Escanea y ve nuestro menú digital', W / 2, y, W - 80);

  const qrSize = 480;
  const qrX = (W - qrSize) / 2;
  const qrY = y + 38;
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

  const urlY = qrY + qrSize + 64;
  ctx.fillStyle = '#6B5E4A';
  ctx.font = '20px monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(menuUrl, W / 2, urlY, W - 80);

  ctx.fillStyle = primaryColor;
  ctx.fillRect(W / 2 - 24, urlY + 20, 48, 3);

  ctx.fillStyle = '#9B8E7B';
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.fillText('Creado con FudiMenu', W / 2, H - 38);

  return canvasToBlob(canvas);
}

// Round sticker (500 × 500), QR + name, sized for packaging/cards. Kept
// deliberately minimal — no logo, the round frame is too tight to stay legible.
async function generateSticker({
  qrImageUrl, tenantName, menuUrl, primaryColor,
}: GenInput): Promise<Blob> {
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

// Shared dark social background (gradient + dotted texture + accent bar).
function paintSocialBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  primaryColor: string,
) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#1A1611');
  grad.addColorStop(1, '#2D2418');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const { r, g, b } = hexToRgb(primaryColor);
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.08)`;
  for (let px = 30; px < W; px += 48) {
    for (let py = 30; py < H; py += 48) {
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, W, 10);
}

// Instagram/WhatsApp feed post — 1080 × 1080 square.
async function generateSocialPost(input: GenInput): Promise<Blob> {
  return generateSocial(input, 1080, 1080, {
    nameSize: 64, qrSize: 460, captionSize: 34,
  });
}

// Instagram/WhatsApp/TikTok story — 1080 × 1920 vertical.
async function generateSocialStory(input: GenInput): Promise<Blob> {
  return generateSocial(input, 1080, 1920, {
    nameSize: 76, qrSize: 560, captionSize: 42,
  });
}

async function generateSocial(
  { qrImageUrl, tenantName, menuUrl, primaryColor, logoUrl, logoShape }: GenInput,
  W: number,
  H: number,
  opts: { nameSize: number; qrSize: number; captionSize: number },
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  paintSocialBackground(ctx, W, H, primaryColor);

  // Header flows top-down (logo? + name); the QR is placed right below the
  // measured header so name and QR can never overlap at any aspect ratio.
  let y = Math.round(H * 0.07);

  const logo = await tryLoadImage(logoUrl);
  if (logo) {
    const lh = drawLogo(ctx, logo, W / 2, y, 320, opts.qrSize * 0.28, logoShape, true);
    y += lh + 36;
  }

  ctx.fillStyle = '#FFFCF5';
  ctx.textAlign = 'center';
  ctx.font = `bold ${opts.nameSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(tenantName, W / 2, y + opts.nameSize, W - 100);
  y += opts.nameSize + 44;

  const qrSize = opts.qrSize;
  const qrX = (W - qrSize) / 2;
  const qrY = y + 28;
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

  const { r, g, b } = hexToRgb(primaryColor);
  let cy = qrY + qrSize + 64;

  ctx.fillStyle = primaryColor;
  ctx.fillRect(W / 2 - 32, cy, 64, 4);
  cy += 50;

  ctx.fillStyle = 'rgba(255, 252, 245, 0.85)';
  ctx.textAlign = 'center';
  ctx.font = `${opts.captionSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillText('Escanea para ver nuestro menú', W / 2, cy, W - 100);
  cy += 50;

  ctx.fillStyle = 'rgba(255, 252, 245, 0.55)';
  ctx.font = '24px monospace, monospace';
  ctx.fillText(menuUrl, W / 2, cy, W - 100);

  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillText('FudiMenu', W / 2, H - 44);

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

const GENERATORS: Record<MaterialType, (input: GenInput) => Promise<Blob>> = {
  poster: generatePoster,
  sticker: generateSticker,
  'social-post': generateSocialPost,
  'social-story': generateSocialStory,
};

const MATERIALS: {
  type: MaterialType;
  label: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  { type: 'poster', label: 'Cartel A4', desc: 'Imprime y pega en mesas o mostrador.', icon: Printer },
  { type: 'sticker', label: 'Sticker', desc: 'Redondo, para empaques o tarjetas.', icon: Sticker },
  { type: 'social-post', label: 'Post de redes', desc: '1080 × 1080 px para feed de Instagram o WhatsApp.', icon: Instagram },
  { type: 'social-story', label: 'Story vertical', desc: '1080 × 1920 px para stories de Instagram o TikTok.', icon: Smartphone },
];

export function QrMaterials({
  qrImageUrl,
  tenantName,
  menuUrl,
  tenantSlug,
  primaryColor,
  logoUrl,
  logoShape,
  tenantId,
}: {
  qrImageUrl: string;
  tenantName: string;
  menuUrl: string;
  tenantSlug: string;
  primaryColor: string;
  logoUrl: string | null;
  logoShape: LogoShape;
  tenantId: string;
}) {
  const [loading, setLoading] = useState<MaterialType | null>(null);

  async function handleDownload(type: MaterialType) {
    setLoading(type);
    try {
      const blob = await GENERATORS[type]({
        qrImageUrl, tenantName, menuUrl, primaryColor, logoUrl, logoShape,
      });

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
      <ul className="mt-4 grid grid-cols-2 gap-3">
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
