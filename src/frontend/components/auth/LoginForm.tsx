import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabaseBrowser } from '../../lib/supabase-browser';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [infoMsg, setInfoMsg] = useState('');
  const [redirectParam, setRedirectParam] = useState('');
  const [produtoParam, setProdutoParam] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) setEmail(emailParam);
    setRedirectParam(params.get('redirect') ?? '');
    setProdutoParam(params.get('produto') ?? '');
    if (params.get('msg') === 'conta-existente') {
      setInfoMsg('Use seu email e senha para entrar.');
    } else if (params.get('msg') === 'sem-acesso') {
      setInfoMsg('Este email não está cadastrado no Nome Magnético. Crie uma conta para começar.');
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: signInData, error: err } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });

      if (err) {
        setError(err.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos'
          : err.message);
        setLoading(false);
        return;
      }

      // Verificar isolamento de app: usuário deve ter a tag 'nome_magnetico'
      // em app_metadata.apps (escrito via service role no cadastro).
      const apps = signInData.user?.app_metadata?.apps as string[] | undefined;
      if (apps !== undefined && !apps.includes('nome_magnetico')) {
        await supabaseBrowser.auth.signOut();
        setError('Este email não está cadastrado no Nome Magnético. Crie uma conta para começar.');
        setLoading(false);
        return;
      }

      // Garantir que o usuário tem perfil neste app (necessário para usuários
      // que já existiam em auth.users via outro app, ex: Sincro).
      // Passa o token no header porque a sessão fica em localStorage (não em cookie).
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      console.log('[LoginForm] sessão obtida após login:', session ? `token=${session.access_token.slice(0, 20)}...` : 'null');

      let epData: any = null;
      try {
        const epRes = await fetch('/api/auth/ensure-profile', {
          method: 'POST',
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });
        const text = await epRes.text();
        console.log('[LoginForm] ensure-profile status:', epRes.status, text.slice(0, 200));
        try { epData = JSON.parse(text); } catch { epData = null; }
        if (!epRes.ok) {
          console.warn('[LoginForm] ensure-profile retornou erro:', epRes.status, epData);
          // Não bloqueia o login — apenas loga. O perfil pode já existir.
        }
      } catch (fetchErr) {
        console.warn('[LoginForm] ensure-profile fetch falhou (não crítico):', fetchErr);
      }

      // Admin bypassa o fluxo de compra
      if (epData?.profile?.role === 'admin') {
        if (session) {
          document.cookie = `nome-magnetico-auth-access-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax`;
          document.cookie = `nome-magnetico-auth-refresh-token=${session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
        }
        window.location.href = '/app';
        return;
      }

      // Setar cookies para que o middleware SSR encontre o token
      if (session) {
        document.cookie = `nome-magnetico-auth-access-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax`;
        document.cookie = `nome-magnetico-auth-refresh-token=${session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      }

      // Redirecionar: produto tem prioridade (vindo do funil landing -> cadastro -> login)
      const searchParams = new URLSearchParams(window.location.search);
      let produto = searchParams.get('produto');

      // Recuperar produto solto durante a confirmação de e-mail (fallback)
      if (!produto) {
        produto = localStorage.getItem('nome_magnetico_pending_product');
      }

      if (produto) {
        localStorage.removeItem('nome_magnetico_pending_product');
        window.location.href = `/comprar?produto=${produto}`;
      } else {
        window.location.href = searchParams.get('redirect') ?? '/app';
      }
    } catch (unexpectedErr) {
      console.error('[LoginForm] erro inesperado no handleSubmit:', unexpectedErr);
      setError('Erro inesperado ao fazer login. Abra o console do navegador (F12) e tente novamente.');
      setLoading(false);
    }
  }

  const signupParams = new URLSearchParams();
  if (email) signupParams.set('email', email);
  if (redirectParam) signupParams.set('redirect', redirectParam);
  if (produtoParam) signupParams.set('produto', produtoParam);
  const signupUrl = `/auth/cadastro${signupParams.toString() ? `?${signupParams.toString()}` : ''}`;

  return (
    <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#111111]/85 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.48)] backdrop-blur-xl">
      <h2 className="font-cinzel text-2xl font-bold text-[#e5e2e1] text-center mb-6">
        Entrar
      </h2>

      {infoMsg && (
        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-3 text-[#D4AF37] text-sm mb-6">
          {infoMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <a href="/auth/esqueci-senha" className="text-sm text-gray-500 hover:text-[#D4AF37] transition-colors">
            Esqueci minha senha
          </a>
        </div>

        <Button type="submit" loading={loading} className="w-full bg-[#D4AF37] text-[#131313] hover:bg-[#f2ca50] shadow-lg shadow-[#D4AF37]/20">
          Entrar
        </Button>
      </form>

      <a
        href={signupUrl}
        className="mt-4 flex w-full items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-5 py-3 text-sm font-bold text-[#D4AF37] transition hover:border-[#D4AF37]/70 hover:bg-[#D4AF37]/15 hover:text-[#f2ca50]"
      >
        Criar Conta
      </a>
    </div>
  );
}
