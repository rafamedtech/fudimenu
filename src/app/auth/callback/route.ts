import { NextResponse, type NextRequest } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';
import { createSupabaseServer } from '@/lib/supabase/server';
import {
  ACTIVE_TENANT_COOKIE,
  activeTenantCookieOptions,
} from '@/server/tenants/active-tenant-cookie';
import { getPostHogClient } from '@/lib/posthog-server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const response = NextResponse.redirect(`${origin}${next}`);

      if (user) {
        const membership = await getPrisma().membership.findFirst({
          where: { userId: user.id, deletedAt: null },
          select: { tenantId: true },
          orderBy: { createdAt: 'asc' },
        });

        if (membership) {
          response.cookies.set(
            ACTIVE_TENANT_COOKIE,
            membership.tenantId,
            activeTenantCookieOptions,
          );
        } else {
          response.cookies.delete(ACTIVE_TENANT_COOKIE);
        }

        const posthog = getPostHogClient();
        if (posthog) {
          posthog.identify({ distinctId: user.id, properties: { email: user.email } });
          posthog.capture({ distinctId: user.id, event: 'user_signed_in', properties: { provider: user.app_metadata?.provider ?? 'email' } });
        }
      }

      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
