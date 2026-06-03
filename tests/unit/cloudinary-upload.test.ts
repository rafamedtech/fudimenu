import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(async () => ({
    userId: 'user-1',
    email: 'owner@example.com',
    tenantId: 'tenant-1',
    plan: 'pro',
    role: 'owner',
    memberships: [],
  })),
  fetch: vi.fn(),
}));

vi.mock('@/server/guards/require-auth', () => ({
  requireAuth: mocks.requireAuth,
}));

async function loadRoute() {
  const mod = await import('../../src/app/api/uploads/cloudinary/route');
  return mod.POST;
}

function makeRequest(formData: FormData) {
  return new NextRequest('http://localhost/api/uploads/cloudinary', {
    method: 'POST',
    body: formData,
  });
}

function validFile(type = 'image/jpeg', name = 'photo.jpg', sizeBytes = 100) {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe('POST /api/uploads/cloudinary', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'test-cloud');
    vi.stubEnv('CLOUDINARY_API_KEY', 'test-key');
    vi.stubEnv('CLOUDINARY_API_SECRET', 'test-secret');
    vi.stubGlobal('fetch', mocks.fetch);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('returns 503 cloudinary_not_configured when env vars missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', '');
    vi.stubEnv('CLOUDINARY_API_KEY', '');
    vi.stubEnv('CLOUDINARY_API_SECRET', '');
    const POST = await loadRoute();
    const res = await POST(makeRequest(new FormData()));
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.error).toBe('cloudinary_not_configured');
  });

  it('returns 401 unauthorized when not authenticated', async () => {
    mocks.requireAuth.mockRejectedValueOnce(new Error('Unauthorized'));
    const POST = await loadRoute();
    const res = await POST(makeRequest(new FormData()));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe('unauthorized');
  });

  it('returns 400 missing_file when no file in form data', async () => {
    const POST = await loadRoute();
    const fd = new FormData();
    fd.set('kind', 'item');
    const res = await POST(makeRequest(fd));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('missing_file');
  });

  it('returns 400 invalid_kind when kind is not logo/tenant-cover/item/section/category', async () => {
    const POST = await loadRoute();
    const fd = new FormData();
    fd.set('kind', 'avatar');
    fd.set('file', validFile());
    const res = await POST(makeRequest(fd));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('invalid_kind');
  });

  it('returns 400 invalid_image when MIME type is not allowed', async () => {
    const POST = await loadRoute();
    const fd = new FormData();
    fd.set('kind', 'item');
    fd.set('file', validFile('image/gif', 'anim.gif'));
    const res = await POST(makeRequest(fd));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('invalid_image');
  });

  it('returns 400 invalid_image when file exceeds 5 MB', async () => {
    const POST = await loadRoute();
    const fd = new FormData();
    fd.set('kind', 'item');
    fd.set('file', validFile('image/jpeg', 'big.jpg', 5 * 1024 * 1024 + 1));
    const res = await POST(makeRequest(fd));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('invalid_image');
  });

  it('accepts file exactly at 5 MB limit', async () => {
    mocks.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ secure_url: 'https://res.cloudinary.com/test/img.jpg', public_id: 'p' }),
    });
    const POST = await loadRoute();
    const fd = new FormData();
    fd.set('kind', 'item');
    fd.set('file', validFile('image/jpeg', 'exact.jpg', 5 * 1024 * 1024));
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
  });

  it.each(['image/png', 'image/webp', 'image/heic', 'image/heif'])(
    'accepts allowed MIME type %s',
    async (mime) => {
      mocks.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ secure_url: 'https://res.cloudinary.com/test/img', public_id: 'p' }),
      });
      const POST = await loadRoute();
      const fd = new FormData();
      fd.set('kind', 'item');
      fd.set('file', validFile(mime, `photo.${mime.split('/')[1]}`));
      const res = await POST(makeRequest(fd));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
    },
  );

  it.each(['logo', 'tenant-cover', 'item', 'section', 'category'])('accepts kind=%s', async (kind) => {
    mocks.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ secure_url: 'https://res.cloudinary.com/test/img.jpg', public_id: 'p' }),
    });
    const POST = await loadRoute();
    const fd = new FormData();
    fd.set('kind', kind);
    fd.set('file', validFile());
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
  });

  it('scopes upload folder to tenantId and kind', async () => {
    mocks.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ secure_url: 'https://res.cloudinary.com/test/img.jpg', public_id: 'p' }),
    });
    const POST = await loadRoute();
    const fd = new FormData();
    fd.set('kind', 'logo');
    fd.set('file', validFile('image/png', 'logo.png'));
    await POST(makeRequest(fd));

    const [url, init] = mocks.fetch.mock.calls[0] as [string, { body: FormData }];
    expect(url).toContain('test-cloud');
    expect((init.body as FormData).get('folder')).toBe('fudimenu/tenant-1/logo');
  });

  it('returns 502 upload_failed when Cloudinary API returns non-ok', async () => {
    mocks.fetch.mockResolvedValueOnce({ ok: false });
    const POST = await loadRoute();
    const fd = new FormData();
    fd.set('kind', 'item');
    fd.set('file', validFile());
    const res = await POST(makeRequest(fd));
    const body = await res.json();
    expect(res.status).toBe(502);
    expect(body.error).toBe('upload_failed');
  });

  it('returns 502 upload_failed when Cloudinary response missing secure_url', async () => {
    mocks.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ public_id: 'p' }),
    });
    const POST = await loadRoute();
    const fd = new FormData();
    fd.set('kind', 'item');
    fd.set('file', validFile());
    const res = await POST(makeRequest(fd));
    const body = await res.json();
    expect(res.status).toBe(502);
    expect(body.error).toBe('upload_failed');
  });

  it('returns url and publicId on success', async () => {
    mocks.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/fudimenu/tenant-1/item/abc.jpg',
        public_id: 'fudimenu/tenant-1/item/abc',
      }),
    });
    const POST = await loadRoute();
    const fd = new FormData();
    fd.set('kind', 'item');
    fd.set('file', validFile());
    const res = await POST(makeRequest(fd));
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.url).toContain('cloudinary.com');
    expect(body.publicId).toBe('fudimenu/tenant-1/item/abc');
  });

  it('applies f_auto,q_auto at delivery time, not as an upload transformation', async () => {
    // f_auto needs the requesting browser; as an incoming/upload transform it
    // rewrites the stored original and corrupts the asset. Must be delivery-only.
    mocks.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/fudimenu/tenant-1/item/abc.jpg',
        public_id: 'fudimenu/tenant-1/item/abc',
      }),
    });
    const POST = await loadRoute();
    const fd = new FormData();
    fd.set('kind', 'item');
    fd.set('file', validFile());
    const res = await POST(makeRequest(fd));
    const body = await res.json();

    // No transformation sent to Cloudinary on upload → original stored intact.
    const [, init] = mocks.fetch.mock.calls[0] as [string, { body: FormData }];
    expect((init.body as FormData).get('transformation')).toBeNull();

    // f_auto,q_auto injected into the returned delivery URL instead.
    expect(body.url).toBe(
      'https://res.cloudinary.com/test-cloud/image/upload/f_auto,q_auto/v1/fudimenu/tenant-1/item/abc.jpg',
    );
  });
});
