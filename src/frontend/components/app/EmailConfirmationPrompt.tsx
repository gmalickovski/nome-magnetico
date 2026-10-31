import { useState } from 'react';

interface Props {
  className?: string;
  compact?: boolean;
}

export function EmailConfirmationPrompt({ className = '', compact = false }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function resend() {
    setStatus('sending');
    setMessage('');
    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect: '/app' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao reenviar confirmação.');
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Erro inesperado.');
    }
  }

  return (
    <div className={className}>
      <p className={compact ? 'text-sm text-slate-300' : 'text-sm leading-relaxed text-slate-300'}>
        {compact
          ? 'Confirme seu e-mail para continuar.'
          : 'Confirme seu e-mail antes de pagar ou baixar PDFs. Verifique sua caixa de entrada (e spam).'}
      </p>
      <button
        type="button"
        onClick={resend}
        disabled={status === 'sending' || status === 'sent'}
        className="mt-3 rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#131313] transition hover:bg-[#f2ca50] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'sending' ? 'Enviando…' : status === 'sent' ? 'E-mail reenviado' : 'Reenviar confirmação'}
      </button>
      {message && <p className="mt-2 text-xs font-semibold text-red-400">{message}</p>}
      {status === 'sent' && !message && (
        <p className="mt-2 text-xs text-emerald-400/90">Link de confirmação enviado. Abra o e-mail e clique no botão.</p>
      )}
    </div>
  );
}
