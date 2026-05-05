'use server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getPrisma } from '@/lib/db/prisma';
import { createSupabaseServer } from '@/lib/supabase/server';
import { mockTenant } from '@/lib/mock/data';
import {
  ACTIVE_TENANT_COOKIE,
  activeTenantCookieOptions,
} from '@/server/tenants/active-tenant-cookie';

const emailSchema = z.string().email('Correo inválido');
const tenantIdSchema = z.string().min(1, 'Restaurante inválido');
const BRANCH_STORAGE_KEY = 'fudi:branch';

export async function signInWithMagicLinkAction(formData: FormData) {
  const email = emailSchema.parse(formData.get('email'));

  if (process.env.USE_MOCKS === 'true') {
    return { ok: true as const, message: 'Mock: link mágico enviado.' };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, message: 'Mandamos un link a tu correo 🔮' };
}

export async function signOutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_TENANT_COOKIE);

  if (process.env.USE_MOCKS !== 'true') {
    const supabase = await createSupabaseServer();
    await supabase.auth.signOut();
  }

  return { ok: true as const, clearLocalStorageKeys: [BRANCH_STORAGE_KEY] };
}

export async function switchTenantAction(input: unknown) {
  const tenantId = tenantIdSchema.parse(input);
  const cookieStore = await cookies();

  if (process.env.USE_MOCKS === 'true') {
    if (tenantId !== mockTenant.id) {
      return { ok: false as const, error: 'No tienes acceso a este restaurante.' };
    }

    cookieStore.set(ACTIVE_TENANT_COOKIE, tenantId, activeTenantCookieOptions);
    revalidatePath('/', 'layout');
    return { ok: true as const, tenantId };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const membership = await getPrisma().membership.findFirst({
    where: { userId: user.id, tenantId, deletedAt: null },
    select: { tenantId: true },
  });

  if (!membership) {
    return { ok: false as const, error: 'No tienes acceso a este restaurante.' };
  }

  cookieStore.set(ACTIVE_TENANT_COOKIE, membership.tenantId, activeTenantCookieOptions);
  revalidatePath('/', 'layout');

  return { ok: true as const, tenantId: membership.tenantId };
}

export async function switchActiveTenantAction(input: unknown) {
  return switchTenantAction(input);
}

export async function switchActiveTenantFormAction(formData: FormData) {
  await switchTenantAction(formData.get('tenantId'));
}
