import React from 'react';
import { Modal } from '../../ui/Modal.js';
import { Button } from '../../ui/Button.js';

export type ConcludeBusyAction = 'save' | 'pdf' | null;

export interface ChatPdfConcludeModalProps {
  open: boolean;
  displayName: string;
  busyAction: ConcludeBusyAction;
  errorMessage?: string | null;
  onClose: () => void;
  onSaveOnly: () => void;
  onSaveAndDownloadPdf: () => void;
}

function ActionSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin shrink-0 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Modal de conclusão da análise escolhida no chat/entrevista:
 * oferece salvar e abrir Minhas Análises ou salvar e já baixar o PDF.
 */
export function ChatPdfConcludeModal({
  open,
  displayName,
  busyAction,
  errorMessage = null,
  onClose,
  onSaveOnly,
  onSaveAndDownloadPdf,
}: ChatPdfConcludeModalProps) {
  const isBusy = busyAction !== null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeDisabled={isBusy}
      closeLabel="Cancelar"
      title="Como deseja concluir sua análise?"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-300 leading-relaxed">
          Nome escolhido:{' '}
          <strong className="font-semibold text-[#e5e2e1]">{displayName}</strong>
        </p>

        {errorMessage && (
          <p
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300 leading-relaxed"
          >
            {errorMessage}
          </p>
        )}

        <div className="space-y-3 pt-1">
          <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.06] p-3.5 space-y-2">
            <Button
              type="button"
              variant="primary"
              pill
              size="md"
              className="w-full font-semibold"
              disabled={isBusy}
              aria-busy={busyAction === 'pdf'}
              onClick={onSaveAndDownloadPdf}
            >
              {busyAction === 'pdf' ? (
                <>
                  <ActionSpinner />
                  <span>Salvando e gerando PDF...</span>
                </>
              ) : (
                <span>Salvar e baixar PDF</span>
              )}
            </Button>
            <p className="text-xs text-gray-300 text-center leading-relaxed">
              Guarda em Minhas análises, inicia o download e volta ao início.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-2">
            <Button
              type="button"
              variant="secondary-gold"
              pill
              size="md"
              className="w-full font-semibold"
              disabled={isBusy}
              aria-busy={busyAction === 'save'}
              onClick={onSaveOnly}
            >
              {busyAction === 'save' ? (
                <>
                  <ActionSpinner />
                  <span>Salvando análise...</span>
                </>
              ) : (
                <span>Salvar</span>
              )}
            </Button>
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Guarda em Minhas análises e volta ao início.
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center leading-relaxed pt-1">
          Você também poderá baixar o PDF depois em Minhas análises.
        </p>
      </div>
    </Modal>
  );
}

export default ChatPdfConcludeModal;
