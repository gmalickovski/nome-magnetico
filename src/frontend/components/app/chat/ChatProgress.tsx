import React, { type ReactNode } from 'react';

export interface ChatProgressProps {
  currentStep: number;
  totalSteps: number;
  /** Mantido por compatibilidade; não exibido no cabeçalho mínimo. */
  remaining?: number;
  className?: string;
  /** Ex.: botão Resumo no mobile (lg:hidden). */
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
    Math.max(5, Math.round((currentStep / Math.max(totalSteps, 1)) * 100))
  );

  return (
    <div className={`w-full px-4 py-2.5 ${className}`}>
      <div className="flex items-center gap-3">
        <span
          className="shrink-0 text-xs font-semibold tabular-nums text-gold w-9"
          aria-live="polite"
        >
          {percent}%
        </span>
        <div
          className="h-1 min-w-0 flex-1 rounded-full bg-white/10 overflow-hidden"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da análise"
        >
          <div
            className="h-full bg-gold transition-all duration-500 ease-out rounded-full"
            style={{ width: `${Math.max(percent, 2)}%` }}
          />
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </div>
  );
}

export default ChatProgress;
