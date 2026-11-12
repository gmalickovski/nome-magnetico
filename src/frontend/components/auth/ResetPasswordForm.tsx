import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabaseBrowser } from '../../lib/supabase-browser';

type State = 'verifying' | 'form' | 'expired' | 'no-token';

export function ResetPasswordForm() {
  const [state, setState] = useState<State>('verifying');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get('token_hash');

    if (!token_hash) {
      setState('no-token');
      return;
    }

    supabaseBrowser.auth
      .verifyOtp({ token_hash, type: 'recovery' })
      .then(({ error }) => {
        if (error) {
          console.error('[ResetPasswordForm]', error.message);
          setState('expired');
        } else {
          setState('form');
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    const { error: err } = await supabaseBrowser.auth.updateUser({ password });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // Setar cookies para o middleware SSR encontrar o token (igual ao LoginForm)
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (session) {
      document.cookie = `nome-magnetico-auth-access-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax`;
      document.cookie = `nome-magnetico-auth-refresh-token=${session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }

    setSuccess(true);
    setTimeout(() => { window.location.href = '/app'; }, 2000);
  }

  if (state === 'verifying') {
    return (
      <div className="text-center">
        <div className="mb-6 text-5xl">⏳</div>
        <h1 className="font-cinzel text-2xl font-bold text-[#D4AF37] mb-3">
          Verificando link...
        </h1>
        <p className="text-gray-400">Aguarde um momento.</p>
      </div>
    );
  }

  if (state === 'expired') {
    return (
      <div className="text-center">
        <div className="mb-6 text-5xl">❌</div>
        <h1 className="font-cinzel text-2xl font-bold text-[#D4AF37] mb-3">
          Link expirado
        </h1>
        <p className="text-gray-400 mb-2">
          Este link de redefinição expirou ou já foi utilizado.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Links de redefinição são válidos por 1 hora.
        </p>
        <a
          href="/auth/esqueci-senha"
          className="inline-block border border-[#D4AF37] text-[#D4AF37] font-bold text-sm px-8 py-3 rounded-full hover:bg-[#D4AF37] hover:text-[#111111] transition-all duration-300 tracking-wide"
        >
          SOLICITAR NOVO LINK
        </a>
      </div>
    );
  }

  if (state === 'no-token') {
    return (
      <div className="text-center">
        <div className="mb-6 text-5xl">📧</div>
        <h1 className="font-cinzel text-2xl font-bold text-[#D4AF37] mb-3">
          Acesse pelo link do email
        </h1>
        <p className="text-gray-400 mb-8">
          Para redefinir sua senha, clique no link enviado para o seu email.
        </p>
        <a
          href="/auth/esqueci-senha"
          className="inline-block border border-[#D4AF37] text-[#D4AF37] font-bold text-sm px-8 py-3 rounded-full hover:bg-[#D4AF37] hover:text-[#111111] transition-all duration-300 tracking-wide"
        >
          SOLICITAR LINK
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="font-cinzel text-2xl font-bold text-white mb-3">Senha Redefinida</h2>
        <p className="text-gray-400">Redirecionando para o app...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-[#D4AF37]/20 rounded-2xl p-8">
      <h2 className="font-cinzel text-2xl font-bold text-white text-center mb-6">
        Nova Senha
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Nova Senha"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          hint="Mínimo de 8 caracteres"
          variant="pill"
        />
        <Input
          label="Confirmar Senha"
          type="password"
          placeholder="Repita a nova senha"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          variant="pill"
        />

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          loading={loading}
          pill
          className="w-full bg-[#D4AF37] text-[#131313] hover:bg-[#f2ca50] shadow-lg shadow-[#D4AF37]/20 py-3 text-sm font-bold"
        >
          Redefinir Senha
        </Button>
      </form>
    </div>
  );
}
