'use server';
import { z } from 'zod';
import { createSupabaseServer } from '@/lib/supabase/server';

const emailSchema = z.string().email('Correo inválido');

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
  if (process.env.USE_MOCKS === 'true') return { ok: true as const };
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  return { ok: true as const };
}
