import React from 'react';
import { IconRotateCcw } from './MobileChatDockIcons.js';

export interface ChatRestartButtonProps {
  onClick: () => void;
  className?: string;
}

/** Pill visível ao lado da barra de progresso com estilo dourado e ícone idêntico à dock mobile. */
export function ChatRestartButton({ onClick, className = '' }: ChatRestartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Reiniciar conversa"
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-[#D4AF37]/45 bg-[#131313]/90 px-3.5 py-1.5 min-h-[36px] text-xs sm:text-sm font-semibold font-inter text-[#D4AF37] shadow-[0_2px_12px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-all duration-200 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#f2ca50] hover:shadow-[0_0_16px_rgba(212,175,55,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 active:scale-95 ${className}`}
    >
      <IconRotateCcw className="h-4 w-4 shrink-0 text-[#D4AF37]" />
      <span>Reiniciar</span>
    </button>
  );
}

export default ChatRestartButton;
