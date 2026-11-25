import React, { useEffect, useRef, useState } from 'react';
import { useFocusTrap } from './useFocusTrap.js';
import { createPortal } from 'react-dom';
import { EmailConfirmationPrompt } from '../EmailConfirmationPrompt.js';
import type { PdfOverlayPhase } from '../../../lib/pdf-download.js';
import { CHAT_PDF_PREP_TIME_LABEL } from './chat-pdf-utils.js';

export type ChatPdfOverlayPhase = PdfOverlayPhase;

export interface ChatPdfPreparingOverlayProps {
  phase: ChatPdfOverlayPhase;
  onRetry?: () => void;
  onDismissError?: () => void;
  readyDownload?: { href: string; filename: string; onDownload: () => void; onContinue: () => void } | null;
  errorMessage?: string | null;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Modal único de preparação/download de PDF usado em todo o app
 * (pós-análise, Minhas Análises, dashboard e páginas de resultado).
 */
export function ChatPdfPreparingOverlay({
  phase,
  onRetry,
  onDismissError,
  readyDownload,
  errorMessage,
}: ChatPdfPreparingOverlayProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [mounted, setMounted] = useState(false);
  const reduced = prefersReducedMotion();
  const isError = phase === 'error';
  const isEmailNotConfirmed = phase === 'email_not_confirmed';
  const isReady = phase === 'ready' && Boolean(readyDownload);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(isReady || isError || isEmailNotConfirmed, dialogRef);
  const visible =
    phase === 'preparing' || phase === 'generating' || isError || isEmailNotConfirmed || isReady;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!visible || isError || isEmailNotConfirmed || isReady) {
      setElapsedMs(0);
      return;
    }
    setElapsedMs(0);
    const start = Date.now();
    const tick = window.setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 1000);
    return () => window.clearInterval(tick);
  }, [visible, phase, isError, isEmailNotConfirmed, isReady]);

  useEffect(() => {
    if (!visible || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [visible]);

  if (!visible) return null;

  const generatingLabel =
    elapsedMs >= 50_000
      ? 'Finalizando sumário e acabamento do PDF…'
      : elapsedMs >= 20_000
        ? 'Diagramando páginas e triângulos…'
        : 'Gerando arquivo PDF…';

  const canDismissBackdrop = isError || isEmailNotConfirmed;

  const content = (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-pdf-prep-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && canDismissBackdrop) {
          onDismissError?.();
        }
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[#131313]/72 backdrop-blur-[20px]"
        aria-hidden
      />
      <div ref={dialogRef} className="relative w-full max-w-md rounded-2xl border border-[rgba(212,175,55,0.22)] bg-[rgba(19,19,19,0.88)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {isReady && readyDownload ? (
          <>
            <h2 id="chat-pdf-prep-title" className="font-cinzel text-lg text-[#e5e2e1]">Seu PDF está pronto</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#e5e2e1]">
              Sua análise foi salva. O download foi solicitado ao navegador. Se ele não iniciar, toque em Baixar PDF.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={readyDownload.href} download={readyDownload.filename} onClick={readyDownload.onDownload}
                className="inline-flex min-h-11 items-center rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#131313] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bea5ff]">
                Baixar PDF
              </a>
              <button type="button" onClick={readyDownload.onContinue}
                className="min-h-11 rounded-full px-5 py-2.5 text-sm font-medium text-[#e5e2e1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bea5ff]">
                Voltar ao início
              </button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#A0A0A0]">Você também pode baixar depois em Minhas análises.</p>
          </>
        ) : isError ? (
          <>
            <h2 id="chat-pdf-prep-title" className="font-cinzel text-lg text-[#e5e2e1]">
              Não foi possível gerar o PDF
            </h2>
            <p className="mt-2 text-sm text-[#76746a]">
              {errorMessage ?? 'Verifique sua conexão e tente novamente. Se persistir, aguarde alguns segundos e toque de novo em Baixar PDF.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#111111] active:scale-[0.98]"
                >
                  Tentar de novo
                </button>
              )}
              {onDismissError && (
                <button
                  type="button"
                  onClick={onDismissError}
                  className="rounded-full px-5 py-2.5 text-sm font-medium text-[#76746a] hover:text-[#e5e2e1]"
                >
                  Fechar
                </button>
              )}
            </div>
          </>
        ) : isEmailNotConfirmed ? (
          <>
            <h2 id="chat-pdf-prep-title" className="font-cinzel text-lg text-[#D4AF37]">
              Confirme seu e-mail
            </h2>
            <div className="mt-3">
              <EmailConfirmationPrompt compact />
            </div>
            {onDismissError && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={onDismissError}
                  className="rounded-full px-5 py-2 text-sm font-medium text-[#76746a] hover:text-[#e5e2e1]"
                >
                  Fechar
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center">
              <svg
                className={`h-8 w-8 text-[#D4AF37] ${reduced ? '' : 'animate-spin'}`}
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-20"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-80"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="chat-pdf-prep-title" className="font-cinzel text-lg text-[#D4AF37]">
                Preparando seu PDF
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#e5e2e1]">
                Estamos finalizando a análise completa com a assinatura escolhida e montando o PDF.
                Isso pode levar {CHAT_PDF_PREP_TIME_LABEL} na primeira vez.
              </p>
              <p className="mt-3 text-xs text-[#76746a]">
                {phase === 'preparing' ? 'Salvando análise…' : generatingLabel}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (mounted && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
}

export default ChatPdfPreparingOverlay;
