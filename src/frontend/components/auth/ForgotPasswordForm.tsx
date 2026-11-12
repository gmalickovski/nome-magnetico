import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Silenciar — sempre mostrar estado de sucesso por segurança
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="glass border-[#D4AF37]/20 rounded-2xl p-8 text-center shadow-2xl shadow-black/50">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="font-cinzel text-2xl font-bold text-white mb-3">Email Enviado</h2>
        <p className="text-gray-400 mb-6">
          Verifique sua caixa de entrada para o link de redefinição de senha.
        </p>
        <a href="/auth/login" className="text-[#D4AF37] hover:underline text-sm">
          Voltar ao login
        </a>
      </div>
    );
  }

  return (
    <div className="glass border-[#D4AF37]/20 rounded-2xl p-8 shadow-2xl shadow-black/50">
      <h2 className="font-cinzel text-2xl font-bold text-white text-center mb-2">
        Esqueci minha Senha
      </h2>
      <p className="text-gray-400 text-sm text-center mb-6">
        Digite seu email e enviaremos um link para redefinir sua senha.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
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
          Enviar Link de Redefinição
        </Button>
      </form>

      <p className="text-center text-gray-500 text-sm mt-6">
        <a href="/auth/login" className="text-[#D4AF37] hover:underline">
          &lt; Voltar ao login
        </a>
      </p>
    </div>
  );
}
