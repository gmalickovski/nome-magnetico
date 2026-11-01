import React, { type ReactNode } from 'react';
import { getScoreTierVisual } from '../../landing/ProductResultFrame.js';

export interface ChatProgressProps {
  currentStep: number;
  totalSteps: number;
  /** Mantido por compatibilidade; não exibido no cabeçalho mínimo. */
  remaining?: number;
  className?: string;
  /** Ex.: botão Reiniciar no desktop (md+); mobile usa a dock. */
  trailing?: ReactNode;
}

export function ChatProgress({
  currentStep,
  totalSteps,
  className = '',
  trailing,
}: ChatProgressProps) {
  const percent = Math.min(
    100,
    Math.max(0, Math.round((currentStep / Math.max(totalSteps, 1)) * 100))
  );
  const displayPercent = percent === 0 ? 0 : Math.max(5, percent);
  const visual = getScoreTierVisual(displayPercent);

  return (
    <div className={`w-full px-4 py-2.5 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-1 min-w-0 flex items-center gap-3 rounded-full bg-[#131313] border border-white/10 px-3 sm:px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          <span
            className="shrink-0 text-xs sm:text-sm font-semibold tabular-nums w-9 sm:w-10 text-right"
            style={{ color: visual.text }}
            aria-live="polite"
          >
            {percent}%
          </span>
          <div
            className="h-2.5 sm:h-3 min-w-0 flex-1 rounded-full bg-white/10 overflow-hidden"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso da análise"
          >
            <div
              className={`h-full rounded-full bg-gradient-to-r ${visual.barGradient} transition-all duration-500 ease-out`}
              style={{ width: `${percent === 0 ? 0 : Math.max(displayPercent, 2)}%` }}
            />
          </div>
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </div>
  );
}

export default ChatProgress;
