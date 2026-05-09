'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useListenForSignIn } from '@/hooks/use-auth-broadcast';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { signInWithMagicLinkAction } from '@/server/actions/auth.actions';
import { track } from '@/lib/analytics/events';

const MAGIC_LINK_POLL_TIMEOUT_MS = 30_000;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next')?.startsWith('/')
    ? searchParams.get('next')!
    : '/dashboard';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicLinkSentAt, setMagicLinkSentAt] = useState<number | null>(null);
  const [magicLinkPollExpired, setMagicLinkPollExpired] = useState(false);

  const handleDetectedSignIn = useCallback(() => {
    if (!magicLinkSentAt) return;

    router.replace(nextPath);
    router.refresh();
  }, [magicLinkSentAt, nextPath, router]);

  useListenForSignIn(handleDetectedSignIn);

  useEffect(() => {
    if (!magicLinkSentAt) return;

    let cancelled = false;
    const supabase = createSupabaseBrowser();
    setMagicLinkPollExpired(false);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        !cancelled &&
        session &&
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')
      ) {
        handleDetectedSignIn();
      }
    });

    const timeout = window.setTimeout(() => {
      if (!cancelled) setMagicLinkPollExpired(true);
    }, MAGIC_LINK_POLL_TIMEOUT_MS);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [handleDetectedSignIn, magicLinkSentAt]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set('email', email);
      fd.set('next', nextPath);
      const res = await signInWithMagicLinkAction(fd);
      if (res.ok) {
        setMagicLinkSentAt(Date.now());
        track('login_magic_link_sent', { email_domain: email.split('@')[1] ?? '' });
        toast.success(res.message);
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error('No pude enviar el link. Reintenta.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    track('login_google_started', {});
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
    } catch {
      toast.error('No pude iniciar sesión con Google. Reintenta.');
      setGoogleLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-8">
      <div className="mb-8 text-center">
        <div className="mb-2 text-5xl">🔮</div>
        <h1 className="text-2xl font-extrabold">Entra a FudiMenu</h1>
        <p className="mt-1 text-sm text-ink-500">Sin contraseñas. Te mandamos un link mágico.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          name="email"
          type="email"
          placeholder="tucorreo@restaurante.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          label="Correo"
        />
        <Button type="submit" size="lg" loading={loading}>
          {magicLinkSentAt ? 'Reenviar link' : 'Mándame link'}
        </Button>
      </form>

      {magicLinkSentAt ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 rounded-md border-[1.5px] border-menta-500/40 bg-menta-50 px-4 py-3 text-sm text-ink-700"
        >
          <p className="font-bold text-ink-900">
            {magicLinkPollExpired ? 'Listo, revisa tu correo' : 'Revisando tu correo...'}
          </p>
          <p className="mt-1">
            Abre el link desde este navegador. Si detectamos tu sesión en otra pestaña, te llevamos
            directo a tu panel.
          </p>
          <p className="mt-2 text-ink-500">
            ¿No llegó? Revisa spam o intenta con Google.
          </p>
        </div>
      ) : null}

      <div className="my-6 flex items-center gap-3 text-xs text-ink-500">
        <div className="h-px flex-1 bg-ink-100" />o<div className="h-px flex-1 bg-ink-100" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        loading={googleLoading}
        onClick={handleGoogleSignIn}
      >
        Continuar con Google
      </Button>
    </main>
  );
}
