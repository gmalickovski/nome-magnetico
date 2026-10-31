import React, { useEffect } from 'react';
import type { ResultPanelData, RadarAxesData, ReadingSummaryItem } from './chat-types.js';
import { ResultPanel } from './ResultPanel.js';
import { ReadingRadar } from './ReadingRadar.js';
import { SummaryCard } from './SummaryCard.js';

export interface SummaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  panelData: ResultPanelData;
  isSuggestion?: boolean;
  onResetToBase?: () => void;
  radarAxes: RadarAxesData;
  summaryItems: ReadingSummaryItem[];
}

export function SummaryDrawer({
  isOpen,
  onClose,
  panelData,
  isSuggestion = false,
  onResetToBase,
  radarAxes,
  summaryItems,
}: SummaryDrawerProps) {
  // Previne scroll do body quando o drawer estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 lg:hidden animate-fade-in"
    >
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside className="fixed right-0 top-0 bottom-0 w-[86vw] max-w-[360px] bg-chat-drawer border-l border-white/10 shadow-2xl flex flex-col overflow-y-auto animate-slide-left z-10">
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-chat-drawer/90 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold" />
            <h2 className="nm-h4 text-sm font-cinzel text-chat-ink">
              Painel de Leitura
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="p-1.5 rounded-full text-chat-muted hover:text-chat-ink hover:bg-white/5 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1">
          {/* Painel do Resultado (evoluindo ou com sugestão ativa) */}
          <ResultPanel
            data={panelData}
            isSuggestion={isSuggestion}
            onResetToBase={onResetToBase}
          />

          {/* Radar Pentagonal dos 5 Eixos */}
          <div className="rounded-2xl border border-white/10 bg-chat-bubble/60 p-3 flex flex-col items-center">
            <span className="text-[11px] font-cinzel font-semibold uppercase tracking-wider text-chat-muted mb-1 self-start">
              Radar das Dimensões
            </span>
            <ReadingRadar axes={radarAxes} />
          </div>

          {/* Card Resumo da Leitura */}
          <SummaryCard items={summaryItems} />
        </div>
      </aside>
    </div>
  );
}

export default SummaryDrawer;
