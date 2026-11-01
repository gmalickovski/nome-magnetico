import React from 'react';

export interface ChatRestartButtonProps {
  onClick: () => void;
  className?: string;
}

function RestartIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M4 4v5h5M16 16v-5h-5M5.5 5.5a6.5 6.5 0 019.2 9.2M14.5 14.5a6.5 6.5 0 01-9.2-9.2"
      />
    </svg>
  );
}

/** Pill visível ao lado da barra de progresso; confirmação fica no handler. */
export function ChatRestartButton({ onClick, className = '' }: ChatRestartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Reiniciar conversa"
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-400/45 bg-[#131313]/90 px-3 py-2 sm:px-3.5 sm:py-2 min-h-[40px] sm:min-h-[36px] text-xs sm:text-sm font-medium font-inter text-amber-200/95 shadow-[0_0_0_1px_rgba(242,202,80,0.08),0_6px_20px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-all duration-200 hover:border-gold hover:bg-gold/10 hover:text-gold hover:shadow-[0_0_20px_rgba(242,202,80,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 active:scale-[0.98] ${className}`}
    >
      <RestartIcon className="h-4 w-4 shrink-0 opacity-90" />
      <span>Reiniciar</span>
    </button>
  );
}

export default ChatRestartButton;
