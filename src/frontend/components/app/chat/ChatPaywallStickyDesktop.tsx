import React from 'react';

export interface ChatPaywallStickyDesktopProps {
  visible: boolean;
  onClick: () => void;
}

export function ChatPaywallStickyDesktop({ visible, onClick }: ChatPaywallStickyDesktopProps) {
  if (!visible) return null;

  return (
    <div className="hidden md:flex absolute bottom-4 left-0 right-0 z-[65] px-2 pointer-events-none justify-center">
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto w-full max-w-xl min-h-[52px] rounded-full bg-[#D4AF37] px-6 py-3 font-semibold text-sm text-[#111111] shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-opacity duration-150 hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-[3px] motion-reduce:transition-none"
      >
        Quero encontrar minha assinatura
      </button>
    </div>
  );
}

export default ChatPaywallStickyDesktop;
