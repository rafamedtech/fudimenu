import { NextResponse } from 'next/server';
import { upsertItemAction } from '@/server/actions/items.actions';

export async function POST(request: Request) {
  if (process.env.E2E_TEST_AUTH !== 'true') {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const input = await request.json();
    const result = await upsertItemAction(input);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'not_found') {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    throw err;
  }
}
