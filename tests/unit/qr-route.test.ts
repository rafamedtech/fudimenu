import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  toBuffer: vi.fn(),
  markTenantQrDownloaded: vi.fn(),
}));

vi.mock('qrcode', () => ({
  default: {
    toBuffer: mocks.toBuffer,
  },
}));

vi.mock('@/lib/ratelimit', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, resetSec: 60 })),
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/server/services/qr-activation.service', () => ({
  markTenantQrDownloaded: mocks.markTenantQrDownloaded,
}));

async function loadRoute() {
  const mod = await import('../../src/app/api/qr/[slug]/route');
  return mod.GET;
}

describe('QR route activation signal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.toBuffer.mockResolvedValue(Buffer.from('qr-png'));
  });

  it('does not mark QR downloaded when rendering the QR image inline', async () => {
    const GET = await loadRoute();

    await GET(new NextRequest('http://localhost/api/qr/taqueria-demo'), {
      params: Promise.resolve({ slug: 'taqueria-demo' }),
    });

    expect(mocks.markTenantQrDownloaded).not.toHaveBeenCalled();
  });

  it('marks QR downloaded when the PNG is requested as a download', async () => {
    const GET = await loadRoute();

    const response = await GET(new NextRequest('http://localhost/api/qr/taqueria-demo?download=1'), {
      params: Promise.resolve({ slug: 'taqueria-demo' }),
    });

    expect(mocks.markTenantQrDownloaded).toHaveBeenCalledWith('taqueria-demo');
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="qr-taqueria-demo.png"');
  });
});
