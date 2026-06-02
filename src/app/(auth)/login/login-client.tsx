'use client';
import { useCallback, useEffect, useReducer } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, QrCode, Utensils } from 'lucide-react';
import { FudiLogo } from '@/components/brand/fudi-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useListenForSignIn } from '@/hooks/use-auth-broadcast';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { signInWithMagicLinkAction } from '@/server/actions/auth.actions';
import { track } from '@/lib/analytics/events';

const MAGIC_LINK_POLL_TIMEOUT_MS = 30_000;
const MAIL_IMAGE =
  'https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/T5aFVdCanUY/components/8YmDwAg9deN.png';

export function LoginClient({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useReducer((_: string, next: string) => next, '');
  const [loading, setLoading] = useReducer((_: boolean, next: boolean) => next, false);
  const [googleLoading, setGoogleLoading] = useReducer((_: boolean, next: boolean) => next, false);
  const [magicLinkSentAt, setMagicLinkSentAt] = useReducer((_: number | null, next: number | null) => next, null);
  const [magicLinkPollExpired, setMagicLinkPollExpired] = useReducer((_: boolean, next: boolean) => next, false);

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

  async function sendMagicLink() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set('email', email);
      fd.set('next', nextPath);
      const res = await signInWithMagicLinkAction(fd);
      if (res.ok) {
        setMagicLinkPollExpired(false);
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await sendMagicLink();
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
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[var(--brand-surface)] p-6 font-sans">
      <div className="absolute left-0 right-0 top-8 flex justify-center ipad-landscape:hidden">
        <FudiLogo markClassName="h-11" textClassName="text-lg" />
      </div>

      <div className="w-full max-w-[480px] space-y-8">
        <div className="relative overflow-hidden rounded-3xl border-[1.5px] border-[var(--brand-card-border)] bg-[var(--brand-card)] p-8 shadow-sm ipad:p-10">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 scale-150 rounded-full bg-[var(--brand-primary-faint)] blur-2xl" />
              <Image
                src={MAIL_IMAGE}
                alt="Correo"
                width={96}
                height={96}
                priority
                className="relative z-10 size-24 object-contain"
              />
            </div>
          </div>

          <div className="mb-8 space-y-2 text-center">
            <h1 className="font-heading text-2xl font-bold tracking-[0] text-ink-900 ipad:text-3xl">
              ¡Hola de nuevo!
            </h1>
            <p className="text-sm text-ink-500 ipad:text-base">
              Ingresa para gestionar tu menú digital
            </p>
          </div>

          {!magicLinkSentAt ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ejemplo@restaurante.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                label="Correo electrónico"
                containerClassName="gap-2 text-left"
                labelClassName="px-1 text-sm font-semibold text-ink-900/80"
                controlClassName="h-12 rounded-xl border-[1.5px] border-[var(--brand-card-border)] focus-within:ring-2 focus-within:ring-[var(--brand-primary-ring)] focus-within:shadow-none"
                className="font-normal placeholder:text-ink-500/60"
              />

              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full rounded-xl font-bold shadow-sm"
              >
                Enviar enlace de acceso
                {!loading && <ArrowRight className="size-5" aria-hidden="true" />}
              </Button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[var(--brand-card-border)]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[var(--brand-card)] px-3 font-medium text-ink-500">
                    O continúa con
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                loading={googleLoading}
                onClick={handleGoogleSignIn}
                className="w-full rounded-xl border-[var(--brand-card-border)] bg-[var(--brand-card)] font-semibold shadow-sm hover:bg-[var(--brand-surface-strong)]"
              >
                {!googleLoading && <GoogleIcon />}
                Entrar con Google
              </Button>
            </form>
          ) : (
            <output
              aria-live="polite"
              className="flex animate-fade-in flex-col items-center gap-4 py-4 text-center"
            >
              <div className="rounded-full bg-menta-100 p-3 text-menta-600">
                <CheckCircle2 className="size-10" aria-hidden="true" />
              </div>
              <h2 className="font-heading text-xl font-bold text-ink-900">
                ¡Revisa tu bandeja!
              </h2>
              <p className="text-sm leading-6 text-ink-500">
                Te enviamos un enlace mágico a <strong>{email}</strong>. Haz clic en el botón para
                entrar.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={loading}
                onClick={sendMagicLink}
                className="h-auto min-h-0 px-2 py-1 text-sm font-bold text-[var(--brand-primary)] hover:underline"
              >
                {magicLinkPollExpired ? '¿No recibiste nada? Reenviar' : 'Reenviar enlace'}
              </Button>
            </output>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-ink-500">
            ¿Aún no tienes cuenta?{' '}
            <Link href="/onboarding" className="font-bold text-[var(--brand-primary)] hover:underline">
              Crea tu menú gratis
            </Link>
          </p>
        </div>
      </div>

      <div className="fixed -bottom-10 -left-10 hidden rotate-12 text-[var(--brand-primary)] opacity-20 ipad-landscape:block">
        <Utensils className="size-64" aria-hidden="true" />
      </div>
      <div className="fixed -right-10 -top-10 hidden -rotate-12 text-menta-500 opacity-20 ipad-landscape:block">
        <QrCode className="size-64" aria-hidden="true" />
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      className="size-5 flex-shrink-0"
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
