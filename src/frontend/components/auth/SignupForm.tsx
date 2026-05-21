import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Props {
  produto?: string;
  redirect?: string;
  prefilledEmail?: string;
}

export function SignupForm({ produto = '', redirect = '', prefilledEmail = '' }: Props) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (produto) {
      localStorage.setItem('nome_magnetico_pending_product', produto);
    }
  }, [produto]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, password, produto, redirect }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.error === 'already_registered') {
        setError('Este email já está registrado. Use-o para fazer login.');
        setLoading(false);
        setTimeout(() => {
          const loginUrl = produto
            ? `/auth/login?produto=${produto}&msg=conta-existente`
            : '/auth/login?msg=conta-existente';
          window.location.href = loginUrl;
        }, 2500);
        return;
      }
      if (data.error === 'email_pending_confirmation') {
        setError('Este email já está cadastrado e aguarda confirmação. Reenviamos o link para sua caixa de entrada.');
        setLoading(false);
        return;
      }
      setError(data.error ?? 'Erro ao criar conta. Tente novamente.');
      setLoading(false);
      return;
    }

    if (data.session?.access_token && data.session?.refresh_token) {
      document.cookie = `nome-magnetico-auth-access-token=${data.session.access_token}; path=/; max-age=3600; SameSite=Lax`;
      document.cookie = `nome-magnetico-auth-refresh-token=${data.session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      window.location.href = redirect || (produto ? `/comprar?produto=${produto}` : '/app');
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    const loginUrl = redirect
      ? `/auth/login?redirect=${encodeURIComponent(redirect)}`
      : produto
      ? `/auth/login?produto=${produto}`
      : '/auth/login';
    return (
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur">
        <h2 className="font-cinzel text-2xl font-bold text-white mb-3">
          Verifique seu Email
        </h2>
        <p className="text-gray-400 mb-6">
          Enviamos um link de confirmação para{' '}
          <strong className="text-gray-200">{email}</strong>.
          Clique no link para ativar sua conta.
        </p>
        <a href={loginUrl} className="text-[#D4AF37] hover:underline text-sm">
          Após confirmar, clique aqui para fazer login
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-8 shadow-2xl shadow-black/50 backdrop-blur">
      <h2 className="font-cinzel text-2xl font-bold text-white text-center mb-6">
        Criar Conta
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Nome"
          placeholder="Seu primeiro nome"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
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
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          hint="Mínimo de 8 caracteres"
        />

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full bg-[#D4AF37] text-slate-950 hover:bg-[#f2ca50]">
          Criar Conta
        </Button>
      </form>

      <a
        href={
          redirect
            ? `/auth/login?redirect=${encodeURIComponent(redirect)}`
            : produto
            ? `/auth/login?produto=${produto}`
            : '/auth/login'
        }
        className="mt-4 flex w-full items-center justify-center rounded-xl border border-[#D4AF37]/60 bg-slate-950/40 px-5 py-3 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
      >
        Já tenho uma conta
      </a>
    </div>
  );
}
