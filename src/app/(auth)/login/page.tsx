'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { Doodle } from '@/components/brand/doodles';
import { FudiLogo } from '@/components/brand/fudi-logo';
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
      const { data, error } = await supabase.auth.signInWithOAuth({
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
        return;
      }

      if (!data?.url) {
        toast.error('No pude iniciar sesión con Google. Reintenta.');
        setGoogleLoading(false);
      }
    } catch {
      toast.error('No pude iniciar sesión con Google. Reintenta.');
      setGoogleLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-[var(--brand-surface)] px-6 py-8 ipad:max-w-[768px] ipad:items-center ipad:justify-center">
      <div className="mb-10 flex justify-center ipad:mb-14">
        <FudiLogo />
      </div>

      <div className="w-full rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-6 text-center shadow-lg ipad:max-w-[640px] ipad:p-10 desktop:max-w-[680px]">
        <Doodle name="mail" className="mx-auto h-32 w-40 ipad:h-40 ipad:w-52" />
        <div className="mb-8">
          <h1 className="fudi-h1">¡Hola de nuevo!</h1>
          <p className="mt-3 text-base font-medium text-ink-500 ipad:text-lg">
            Ingresa para gestionar tu menú digital.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            name="email"
            type="email"
            placeholder="ejemplo@restaurante.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            label="Correo electrónico"
          />
          <Button type="submit" size="xl" loading={loading} className="mt-2 font-black">
            {magicLinkSentAt ? 'Reenviar enlace de acceso' : 'Enviar enlace de acceso'}
            {!loading && <ArrowRight className="h-5 w-5" />}
          </Button>
        </form>

        {magicLinkSentAt ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-5 rounded-lg border border-menta-500/20 bg-menta-50 px-5 py-4 text-left text-sm text-ink-700 shadow-sm"
          >
            <p className="font-bold text-ink-900 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-menta-500 animate-ping" />
              {magicLinkPollExpired ? 'Listo, revisa tu correo' : 'Revisando tu bandeja...'}
            </p>
            <p className="mt-1.5 leading-relaxed">
              Abre el enlace desde este navegador. Si detectamos tu sesión en otra pestaña, te redirigiremos de inmediato.
            </p>
            <p className="mt-2 text-xs text-ink-500">
              ¿No llegó? Revisa spam o intenta con Google.
            </p>
          </div>
        ) : null}

        <div className="my-8 flex items-center gap-4 text-xs font-bold uppercase text-ink-500">
          <div className="h-px flex-1 bg-ink-100" />
          <span>O continuar con</span>
          <div className="h-px flex-1 bg-ink-100" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="xl"
          loading={googleLoading}
          onClick={handleGoogleSignIn}
          className="font-bold tracking-wide flex items-center justify-center gap-2 border-[1.5px] border-ink-100 shadow-sm hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-faint)] transition-all bg-white"
        >
          {!googleLoading && <GoogleIcon />}
          Entrar con Google
        </Button>
      </div>

      <p className="mt-8 text-center text-base text-ink-500">
        ¿Aún no tienes cuenta?{' '}
        <Link href="/onboarding" className="font-black text-[var(--brand-primary)] hover:underline">
          Crea tu menú gratis
        </Link>
      </p>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      className="h-5 w-5 flex-shrink-0"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}
