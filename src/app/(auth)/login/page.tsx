'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { signInWithMagicLinkAction } from '@/server/actions/auth.actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set('email', email);
      const res = await signInWithMagicLinkAction(fd);
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
    } catch {
      toast.error('No pude enviar el link. Reintenta.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
          Mándame link
        </Button>
      </form>

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
