import { NextResponse, type NextRequest } from 'next/server';
import QRCode from 'qrcode';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const rateLimit = await checkRateLimit(`${getClientIp(request.headers)}:${slug}`, {
    identifier: 'qr-png',
    requests: 30,
    windowSec: 60,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetSec) } },
    );
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/m/${slug}`;
  const buffer = await QRCode.toBuffer(url, {
    width: 600,
    margin: 2,
    color: { dark: '#1A1611', light: '#FFFCF5' },
    errorCorrectionLevel: 'H',
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, immutable',
      ...(request.nextUrl.searchParams.get('download') === '1'
        ? { 'Content-Disposition': `attachment; filename="qr-${slug}.png"` }
        : {}),
    },
  });
}
