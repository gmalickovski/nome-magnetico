import React, { useEffect, useState } from 'react';
import { CHAT_PDF_PREP_TIME_LABEL } from './chat-pdf-utils.js';

export type ChatPdfOverlayPhase = 'idle' | 'preparing' | 'generating' | 'error';

export interface ChatPdfPreparingOverlayProps {
  phase: ChatPdfOverlayPhase;
  onRetry?: () => void;
  onDismissError?: () => void;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ChatPdfPreparingOverlay({
  phase,
  onRetry,
  onDismissError,
}: ChatPdfPreparingOverlayProps) {
  const [progress, setProgress] = useState(0);
  const reduced = prefersReducedMotion();
  const visible = phase === 'preparing' || phase === 'generating' || phase === 'error';

  useEffect(() => {
    if (!visible || phase === 'error') {
      setProgress(0);
      return;
    }
    setProgress(phase === 'preparing' ? 18 : 42);
    const start = Date.now();
    const cap = phase === 'preparing' ? 45 : 92;
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const bump = phase === 'preparing' ? elapsed / 120 : elapsed / 80;
      setProgress((p) => Math.min(cap, Math.max(p, bump)));
    }, 280);
    return () => window.clearInterval(tick);
  }, [visible, phase]);

  useEffect(() => {
    if (phase === 'idle') setProgress(0);
  }, [phase]);

  if (!visible) return null;

  const isError = phase === 'error';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-pdf-prep-title"
    >
      <div
        className="absolute inset-0 bg-[#131313]/72 backdrop-blur-[20px]"
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[rgba(212,175,55,0.22)] bg-[rgba(19,19,19,0.88)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {isError ? (
          <>
            <h2 id="chat-pdf-prep-title" className="font-cinzel text-lg text-[#e5e2e1]">
              Não foi possível gerar o PDF
            </h2>
            <p className="mt-2 text-sm text-[#76746a]">
              Verifique sua conexão e tente novamente. Se persistir, aguarde alguns segundos e
              toque de novo em Baixar PDF.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#111111] active:scale-[0.98]"
              >
                Tentar de novo
              </button>
              <button
                type="button"
                onClick={onDismissError}
                className="rounded-full px-5 py-2.5 text-sm font-medium text-[#76746a] hover:text-[#e5e2e1]"
              >
                Fechar
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="chat-pdf-prep-title" className="font-cinzel text-lg text-[#D4AF37]">
              Preparando seu PDF
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#e5e2e1]">
              Estamos finalizando a análise completa com a assinatura escolhida e montando o PDF.
              Isso pode levar {CHAT_PDF_PREP_TIME_LABEL} na primeira vez.
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className={`h-full rounded-full bg-[#D4AF37] ${
                  reduced ? '' : 'transition-[width] duration-300 ease-out'
                }`}
                style={{ width: `${Math.round(progress)}%` }}
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-[#76746a]">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#D4AF37]" />
              {phase === 'preparing' ? 'Salvando análise…' : 'Gerando arquivo PDF…'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default ChatPdfPreparingOverlay;
