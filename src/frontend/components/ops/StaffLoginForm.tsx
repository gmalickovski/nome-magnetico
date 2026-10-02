import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabaseBrowser } from '../../lib/supabase-browser';
import { clearAuthCookies, writeAuthCookies } from '../../lib/auth-cookies';
import { safeOpsRedirect } from '../../../shared/ops-routes';

export function StaffLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('msg') === 'sem-acesso') {
      setInfo('Este email não está cadastrado no Nome Magnético.');
    }
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: signInData, error: signInError } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : signInError.message);
        setLoading(false);
        return;
      }

      const apps = signInData.user?.app_metadata?.apps as string[] | undefined;
      if (apps !== undefined && !apps.includes('nome_magnetico')) {
        await supabaseBrowser.auth.signOut();
        clearAuthCookies();
        setError('Este email não está cadastrado no Nome Magnético.');
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabaseBrowser.auth.getSession();
      const userId = signInData.user?.id;
      if (!session || !userId) {
        setError('Não foi possível abrir a sessão.');
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabaseBrowser
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (profileError || profile?.role !== 'admin') {
        await supabaseBrowser.auth.signOut();
        clearAuthCookies();
        setError('Esta conta não tem permissão de equipe.');
        setLoading(false);
        return;
      }

      writeAuthCookies(session.access_token, session.refresh_token);
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      window.location.href = safeOpsRedirect(redirect);
    } catch {
      setError('Erro inesperado ao entrar. Tente de novo.');
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-[#1c1b1a]/80 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-8">
      <p className="mb-1 text-center text-[11px] sm:mb-2 uppercase tracking-[0.18em] text-[#76746a]">Operação</p>
      <h1 className="mb-4 text-center font-cinzel text-xl sm:mb-6 sm:text-2xl font-bold text-[#e5e2e1]">Acesso da equipe</h1>

      {info && (
        <div className="mb-4 rounded-2xl bg-[#d7c6ff]/10 px-4 py-3 text-sm text-[#d7c6ff]">{info}</div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
        <Input
          label="Email"
          type="email"
          placeholder="equipe@nomemagnetico.com.br"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          className="text-base"
        />
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
          className="text-base"
        />

        {error && (
          <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
        )}

        <div className="flex justify-end">
          <a href="/auth/esqueci-senha" className="-my-2 inline-flex min-h-[44px] items-center text-sm text-[#76746a] transition-colors hover:text-[#f2ca50]">
            Esqueci minha senha
          </a>
        </div>

        <Button type="submit" loading={loading} size="lg" className="w-full !rounded-full">
          Entrar
        </Button>
      </form>
    </div>
  );
}
