import React from 'react';

export interface ChatProgressProps {
  currentStep: number;
  totalSteps: number;
  remaining: number;
  className?: string;
}

export function ChatProgress({
  currentStep,
  totalSteps,
  remaining,
  className = '',
}: ChatProgressProps) {
  const percent = Math.min(
    100,
    Math.max(5, Math.round((currentStep / Math.max(totalSteps, 1)) * 100))
  );

  return (
    <div className={`w-full px-4 py-2 border-b border-white/5 bg-dark-deeper/50 ${className}`}>
      <div className="flex items-center justify-between nm-caption text-xs mb-1 text-chat-muted">
        <span className="font-medium text-gold">{percent}% concluído</span>
        <span>{remaining > 0 ? `faltam ~${remaining}` : 'etapa final'}</span>
      </div>
      <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gold transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

export default ChatProgress;
