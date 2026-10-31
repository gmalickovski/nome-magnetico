import React from 'react';
import { SummaryButton } from './SummaryButton.js';

export interface ChatHeaderProps {
  summaryCount: number;
  onOpenSummary: () => void;
  className?: string;
}

export function ChatHeader({
  summaryCount,
  onOpenSummary,
  className = '',
}: ChatHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-20 bg-dark-deeper/90 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between ${className}`}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 rounded-full bg-gradient-to-br from-gold via-chat-orb to-brand-spiritual shadow-gold-sm flex-shrink-0 animate-pulse-gold"
          aria-hidden="true"
        />
        <div>
          <h1 className="nm-h4 text-chat-ink leading-tight">Nome Magnético</h1>
          <p className="nm-caption text-chat-muted text-xs">
            vamos achar a sua melhor assinatura
          </p>
        </div>
      </div>

      <div className="lg:hidden">
        <SummaryButton count={summaryCount} onClick={onOpenSummary} />
      </div>
    </header>
  );
}

export default ChatHeader;
