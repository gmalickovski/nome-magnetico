import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface VoteConfirmDialogProps {
  open: boolean;
  optionLabel: string;
  submitting: boolean;
  /** Mensagem de erro (a caixa fica aberta para tentar de novo). */
  error?: string;
  /** Texto do botão de confirmar: muda para "Tentar de novo" depois de uma falha. */
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Elemento que abriu a caixa: recebe o foco de volta ao fechar. */
  returnFocusTo?: HTMLElement | null;
}

const FOCUSAVEL =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Confirmação do voto (DEV-316). Caixa acessível: nome e descrição, foco inicial e contido,
 * Tab e Shift+Tab em ciclo, Escape e clique fora cancelam (menos durante o envio), foco devolvido
 * ao botão de origem. Renderizada no `body` para não herdar transformações da seção.
 */
export function VoteConfirmDialog({
  open,
  optionLabel,
  submitting,
  error,
  confirmLabel,
  onConfirm,
  onCancel,
  returnFocusTo,
}: VoteConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const submittingRef = useRef(submitting);
  submittingRef.current = submitting;

  // Foco inicial, trava de rolagem e devolução do foco.
  useEffect(() => {
    if (!open) return;
    const origem = returnFocusTo ?? (document.activeElement as HTMLElement | null);
    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    confirmRef.current?.focus();
    return () => {
      document.body.style.overflow = overflowAntes;
      origem?.focus?.();
    };
  }, [open, returnFocusTo]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (!submittingRef.current) onCancel();
        return;
      }
      if (e.key !== 'Tab') return;
      const itens = [...(cardRef.current?.querySelectorAll<HTMLElement>(FOCUSAVEL) ?? [])];
      if (itens.length === 0) {
        e.preventDefault();
        return;
      }
      const primeiro = itens[0]!;
      const ultimo = itens[itens.length - 1]!;
      const ativo = document.activeElement;
      if (e.shiftKey && (ativo === primeiro || !cardRef.current?.contains(ativo))) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (ativo === ultimo || !cardRef.current?.contains(ativo))) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onCancel]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-vote-dialog
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => {
          if (!submitting) onCancel();
        }}
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 w-full max-w-md rounded-2xl bg-[#131313] p-6 sm:p-8 text-left shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
      >
        <p className="nm-eyebrow mb-2">Confirmar voto</p>
        <h3 id={titleId} className="font-cinzel text-xl font-bold text-[#D4AF37] mb-3 text-balance">
          Votar em {optionLabel}?
        </h3>
        <p id={descId} className="nm-body mb-5">
          Você escolheu <strong className="text-[#e5e2e1]">{optionLabel}</strong>. Seu voto é anônimo: contamos só a
          opção escolhida, sem cookies e sem dados pessoais.
        </p>

        {error && (
          <p role="alert" className="mb-5 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="min-h-[44px] rounded-full bg-[#2A2A2A] px-6 text-sm font-medium text-gray-200 transition-colors hover:bg-[#333333] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d7c6ff] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            aria-busy={submitting}
            className="min-h-[44px] rounded-full bg-[#D4AF37] px-6 text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-[#f2ca50] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d7c6ff] disabled:opacity-60"
          >
            {submitting ? 'Registrando voto...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default VoteConfirmDialog;
