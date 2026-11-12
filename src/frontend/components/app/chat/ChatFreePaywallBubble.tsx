import React from 'react';
import { Button } from '../../ui/Button.js';
import { MapDownloadIcon } from '../MapDownloadIcon.js';

export interface ChatFreePaywallBubbleProps {
  priceLabel: string;
  pdfLoading?: boolean;
  onPaidClick: () => void;
  onFreePdfClick: () => void;
}

export function ChatFreePaywallBubble({
  priceLabel,
  pdfLoading = false,
  onPaidClick,
  onFreePdfClick,
}: ChatFreePaywallBubbleProps) {
  const priceSuffix = priceLabel ? ` · ${priceLabel}` : '';

  return (
    <div className="mt-4 flex flex-col gap-4">
      <p className="text-chat-ink leading-relaxed">
        Essa é a leitura do seu nome de nascimento. O próximo passo é conhecer você melhor e encontrar
        as assinaturas que harmonizam com o seu mapa. Essa parte faz parte do Nome Social.
      </p>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onPaidClick}
          className="w-full min-h-[48px] rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#111111] shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-opacity duration-150 hover:opacity-95 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-[3px] motion-reduce:transition-none"
        >
          Quero encontrar minha assinatura
        </button>
        <p className="text-center text-[11px] text-chat-muted leading-snug">
          Análise completa + sugestões de nome + PDF{priceSuffix}
        </p>

        <Button
          variant="primary"
          size="icon"
          className="h-11 w-11 self-center rounded-full"
          aria-label={pdfLoading ? 'Preparando PDF' : 'Baixar minha análise gratuita (PDF)'}
          title="Baixar minha análise gratuita (PDF)"
          aria-busy={pdfLoading}
          disabled={pdfLoading}
          onClick={onFreePdfClick}
        >
          <MapDownloadIcon className={pdfLoading ? 'motion-safe:animate-pulse' : ''} />
        </Button>
        <p className="text-center text-[11px] text-chat-muted leading-snug">
          Leitura do seu nome atual. Fica salva na sua conta.
        </p>
      </div>
    </div>
  );
}

export default ChatFreePaywallBubble;
