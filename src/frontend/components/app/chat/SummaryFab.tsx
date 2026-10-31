import React from 'react';

export interface SummaryFabProps {
  count: number;
  onClick: () => void;
  className?: string;
}

/** Botão fixo discreto (< md) para abrir o painel de leitura. */
export function SummaryFab({ count, onClick, className = '' }: SummaryFabProps) {
  if (count <= 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Abrir painel de leitura (${count} itens)`}
      className={`md:hidden fixed z-40 right-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#131313]/90 text-chat-muted shadow-[0_8px_28px_rgba(0,0,0,0.55)] backdrop-blur-md transition-colors hover:border-gold/35 hover:text-gold ${className}`}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M4 6h16M4 12h10M4 18h14M16 8l4 4-4 4"
        />
      </svg>
      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold tabular-nums text-dark-deeper">
        {count > 9 ? '9+' : count}
      </span>
    </button>
  );
}

export default SummaryFab;
