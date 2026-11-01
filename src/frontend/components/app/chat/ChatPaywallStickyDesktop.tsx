import React from 'react';

export interface ChatPaywallStickyDesktopProps {
  visible: boolean;
  onClick: () => void;
}

export function ChatPaywallStickyDesktop({ visible, onClick }: ChatPaywallStickyDesktopProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden md:inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2 min-h-[36px] text-xs font-bold uppercase tracking-wider text-[#131313] shadow-[0_2px_16px_rgba(212,175,55,0.35)] transition-all duration-200 hover:bg-[#f2ca50] hover:shadow-[0_4px_24px_rgba(212,175,55,0.5)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-[2px] motion-reduce:transition-none"
    >
      Quero encontrar minha assinatura
    </button>
  );
}

export default ChatPaywallStickyDesktop;
