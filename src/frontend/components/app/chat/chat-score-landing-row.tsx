import React from 'react';
import { getScoreTierVisual } from '../../landing/ProductResultFrame.js';

export interface ChatScoreLandingRowProps {
  eyebrow: string;
  nome: string;
  score: number;
  className?: string;
}

/** Uma linha nome + nota + barra (mesmo padrão visual da landing). */
export function ChatScoreLandingRow({
  eyebrow,
  nome,
  score,
  className = '',
}: ChatScoreLandingRowProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const visual = getScoreTierVisual(clamped);

  return (
    <div className={`flex flex-col gap-1.5 min-w-0 w-full ${className}`}>
      <p className="font-cinzel text-[11px] sm:text-xs uppercase tracking-[0.14em] text-gray-500 leading-snug">
        {eyebrow}
      </p>
      <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0 w-full">
        <h4
          className="min-w-0 flex-1 font-cinzel text-sm sm:text-[15px] font-bold text-[#e5e2e1] leading-snug whitespace-normal"
          title={nome}
        >
          {nome}
        </h4>
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <span
            className="font-cinzel font-bold text-xl sm:text-2xl tabular-nums leading-none"
            style={{ color: visual.text }}
          >
            {clamped}
            <span className="text-xs font-inter font-normal text-gray-500 ml-0.5">/100</span>
          </span>
          <span
            className={`text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full border ${visual.badgeClass} whitespace-nowrap`}
          >
            {visual.code} · {visual.label}
          </span>
        </div>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mt-0.5">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${visual.barGradient} transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export default ChatScoreLandingRow;
