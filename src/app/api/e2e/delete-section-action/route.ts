import { NextResponse } from 'next/server';
import { softDeleteSectionAction } from '@/server/actions/sections.actions';

export async function POST(request: Request) {
  if (process.env.E2E_TEST_AUTH !== 'true') {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const { sectionId } = await request.json() as { sectionId: string };
    const result = await softDeleteSectionAction(sectionId);
    if (!result.ok) {
      const status = result.code === 'not_found' ? 404 : 401;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'not_found') {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    throw err;
  }
}
