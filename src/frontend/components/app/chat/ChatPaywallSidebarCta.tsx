import React from 'react';

export interface ChatPaywallSidebarCtaProps {
  priceLabel: string;
  onClick: () => void;
}

export function ChatPaywallSidebarCta({ priceLabel, onClick }: ChatPaywallSidebarCtaProps) {
  const priceSuffix = priceLabel ? ` · ${priceLabel}` : '';

  return (
    <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#131313]/80 p-4 flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        className="w-full min-h-[44px] rounded-full bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#111111] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-[3px] motion-reduce:transition-none"
      >
        Quero encontrar minha assinatura
      </button>
      <p className="text-[11px] text-chat-muted text-center leading-snug">
        Análise completa + sugestões de nome + PDF{priceSuffix}
      </p>
    </div>
  );
}

export default ChatPaywallSidebarCta;
