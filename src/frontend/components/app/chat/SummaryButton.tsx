import React, { useEffect, useState } from 'react';

export interface SummaryButtonProps {
  count: number;
  onClick: () => void;
  className?: string;
}

export function SummaryButton({
  count,
  onClick,
  className = '',
}: SummaryButtonProps) {
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setPulsing(true);
      const timer = setTimeout(() => setPulsing(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver resumo com ${count} itens`}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-inter transition-all duration-300 border ${
        pulsing
          ? 'bg-gold text-dark-deeper border-gold shadow-gold animate-pulse-gold'
          : 'bg-chat-bubble text-chat-ink border-white/15 hover:border-gold/50 hover:bg-gold/10'
      } ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-gold" />
      <span>Resumo</span>
      <span className="opacity-60">·</span>
      <span>{count}</span>
    </button>
  );
}

export default SummaryButton;
