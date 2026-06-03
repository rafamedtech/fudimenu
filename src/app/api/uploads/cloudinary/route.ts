import { createHash } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/server/guards/require-auth';

export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);
const ALLOWED_KINDS = new Set(['logo', 'tenant-cover', 'item', 'section', 'category']);

function getCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

function signUpload(params: Record<string, string>, apiSecret: string) {
  const canonical = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return createHash('sha1').update(`${canonical}${apiSecret}`).digest('hex');
}

export async function POST(request: NextRequest) {
  const config = getCloudinaryConfig();
  if (!config) {
    return NextResponse.json({ ok: false, error: 'cloudinary_not_configured' }, { status: 503 });
  }

  let ctx;
  try {
    ctx = await requireAuth();
  } catch {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const kind = formData.get('kind')?.toString() ?? 'item';

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'missing_file' }, { status: 400 });
  }

  if (!ALLOWED_KINDS.has(kind)) {
    return NextResponse.json({ ok: false, error: 'invalid_kind' }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_BYTES || !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ ok: false, error: 'invalid_image' }, { status: 400 });
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const folder = `fudimenu/${ctx.tenantId}/${kind}`;
  const uploadParams = {
    folder,
    timestamp,
    transformation: 'f_auto,q_auto',
  };
  const signature = signUpload(uploadParams, config.apiSecret);
  const uploadData = new FormData();
  uploadData.set('file', file);
  uploadData.set('api_key', config.apiKey);
  uploadData.set('timestamp', timestamp);
  uploadData.set('folder', folder);
  uploadData.set('transformation', uploadParams.transformation);
  uploadData.set('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    {
      method: 'POST',
      body: uploadData,
    },
  );

  if (!response.ok) {
    return NextResponse.json({ ok: false, error: 'upload_failed' }, { status: 502 });
  }

  const result = (await response.json()) as { secure_url?: string; public_id?: string };
  if (!result.secure_url) {
    return NextResponse.json({ ok: false, error: 'upload_failed' }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    url: result.secure_url,
    publicId: result.public_id ?? null,
  });
}
