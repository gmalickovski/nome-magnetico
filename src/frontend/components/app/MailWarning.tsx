import { useEffect, useState } from 'react';

export function MailWarning({ email }: { email: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showSentModal, setShowSentModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem('nm-mail-warning-dismissed') === email);
  }, [email]);

  function dismiss() {
    localStorage.setItem('nm-mail-warning-dismissed', email);
    setDismissed(true);
  }

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
      setShowSentModal(true);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Erro inesperado.');
    }
  }

  if (dismissed) return null;

  return (
    <>
      <div className="-mx-2 -mt-6 mb-6 flex items-center justify-between gap-3 bg-amber-500 px-4 py-1.5 text-[#131313] sm:-mx-4 md:-mx-10 md:-mt-10 md:mb-8 md:justify-center md:gap-8 md:py-2 lg:-mx-14">
        <div className="flex min-w-0 flex-1 items-center justify-start gap-2 text-left md:flex-none">
          <svg className="h-3.5 w-3.5 flex-shrink-0 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-[9px] font-black uppercase leading-snug tracking-[0.08em] md:text-[11px] md:tracking-[0.12em]">
            Verifique seu e-mail para garantir a segurança dos seus documentos.
          </p>
        </div>
        <button
          type="button"
          onClick={resend}
          disabled={status === 'sending'}
          className="flex-shrink-0 text-[9px] font-black uppercase tracking-[0.05em] underline underline-offset-4 transition hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-60 md:text-[11px] md:tracking-[0.08em]"
        >
          {status === 'sending' ? 'Enviando...' : 'Verificar E-mail'}
        </button>
        {message && <p className="hidden text-center text-[11px] font-bold text-red-950 md:block">{message}</p>}
        <button
          type="button"
          onClick={dismiss}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-black text-[#131313]/55 transition hover:bg-[#131313]/10 hover:text-[#131313]"
          aria-label="Fechar aviso de confirmacao de e-mail"
        >
          x
        </button>
      </div>
      {message && <p className="-mt-4 mb-4 text-center text-[10px] font-bold text-red-300 md:hidden">{message}</p>}

      {showSentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/30 bg-slate-900 p-6 shadow-2xl shadow-black/60">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 font-cinzel text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Confirmação enviada</p>
                <h2 className="font-cinzel text-2xl font-bold text-[#e5e2e1]">Verifique seu e-mail</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSentModal(false)}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
                aria-label="Fechar"
              >
                x
              </button>
            </div>

            <p className="text-sm leading-relaxed text-slate-300">
              Foi enviado um e-mail para <span className="font-semibold text-[#D4AF37]">{email}</span>.
              Clique no link dentro do e-mail para confirmar sua conta.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Depois da confirmação, você será direcionado para a página de sucesso e voltará para o painel.
              Se a sessão não estiver mais ativa, o sistema pedirá login novamente.
            </p>

            <button
              type="button"
              onClick={() => setShowSentModal(false)}
              className="mt-6 w-full rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#131313] transition hover:bg-[#f2ca50]"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
