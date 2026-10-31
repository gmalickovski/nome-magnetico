import React, { useState } from 'react';
import type { ReadingSummaryItem } from './chat-types.js';

export interface SummaryCardProps {
  items: ReadingSummaryItem[];
  defaultOpen?: boolean;
  className?: string;
}

export function SummaryCard({
  items,
  defaultOpen = true,
  className = '',
}: SummaryCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-chat-bubble/70 p-4 transition-all duration-200 ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded-lg"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gold" />
          <h3 className="nm-h4 text-sm font-cinzel text-chat-ink">
            Resumo da leitura
          </h3>
          <span className="text-xs font-inter text-chat-muted">
            ({items.length} {items.length === 1 ? 'item' : 'itens'})
          </span>
        </div>

        <svg
          className={`w-4 h-4 text-chat-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2.5 animate-fade-in">
          {items.length === 0 ? (
            <p className="text-xs text-chat-muted font-inter italic">
              Ele se escreve sozinho enquanto você responde.
            </p>
          ) : (
            items.map((item, index) => (
              <div
                key={`summary-${index}-${item.label}`}
                className="flex flex-col text-xs space-y-0.5"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-chat-muted">
                  {item.label}
                </span>
                <span className="text-chat-ink font-medium font-inter">
                  {item.value}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default SummaryCard;
