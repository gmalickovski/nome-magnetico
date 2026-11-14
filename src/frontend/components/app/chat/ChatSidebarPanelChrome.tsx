import React, { type ReactNode } from 'react';

export interface ChatSidebarPanelChromeProps {
  expanded: boolean;
  onToggleExpand: () => void;
  hasSelection?: boolean;
  children: ReactNode;
  className?: string;
}

export function ChatSidebarPanelChrome({
  expanded,
  onToggleExpand,
  hasSelection = false,
  children,
  className = '',
}: ChatSidebarPanelChromeProps) {
  return (
    <div className={`flex flex-col min-h-0 h-full w-full relative ${className}`}>
      {/* Header bar fixo no topo, com botão permanentemente alinhado ao centro do título */}
      <div className="shrink-0 relative w-full mb-4 sm:mb-5 px-1 min-h-[36px] flex items-center">
        {(() => {
          const titleNode = (
            <div className="flex items-center gap-2.5 min-w-0 pr-10">
              {hasSelection && (
                <span
                  data-nm-selection-dot="true"
                  className="w-2.5 h-2.5 rounded-full bg-[#f2ca50] shadow-[0_0_10px_rgba(242,202,80,0.65)] shrink-0"
                  aria-hidden="true"
                />
              )}
              <h2
                id="desktop-summary-title"
                data-expanded={expanded ? 'true' : 'false'}
                className="font-cinzel font-bold uppercase tracking-[0.1em] text-[#e5e2e1] text-left break-words whitespace-normal leading-snug min-w-0"
              >
                Painel de análise
              </h2>
            </div>
          );
          return expanded ? (
            <div className="max-w-4xl mx-auto w-full px-4 sm:px-6">{titleNode}</div>
          ) : (
            titleNode
          );
        })()}

        {/* Botão permanentemente fixo no canto direito da linha do título, somente ícone (sem círculo/fundo) */}
        <button
          type="button"
          onClick={onToggleExpand}
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg bg-transparent text-[#e5e2e1]/80 hover:text-[#f2ca50] transition-colors duration-200 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]/70"
          title={expanded ? 'Recolher painel (voltar ao chat)' : 'Expandir painel de análise'}
          aria-label={expanded ? 'Recolher painel (voltar ao chat)' : 'Expandir painel de análise'}
        >
          {expanded ? (
            /* Ícone de fechar/recolher: setas apontando para dentro */
            <svg
              className="w-[18px] h-[18px] sm:w-5 sm:h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75" />
              <path d="M15 9h4.5M15 9V4.5M15 9l5.25-5.25" />
              <path d="M9 15v4.5M9 15H4.5M9 15l-5.25 5.25" />
              <path d="M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
            </svg>
          ) : (
            /* Ícone de expandir/abrir: setas apontando para fora */
            <svg
              className="w-[18px] h-[18px] sm:w-5 sm:h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9" />
              <path d="M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9" />
              <path d="M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15" />
              <path d="M20.25 20.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          )}
        </button>
      </div>

      {/* Conteúdo com scrollbar colada na borda da tela */}
      <div className="flex-1 min-h-0 chat-scroll-pane pt-0.5">
        {expanded ? (
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6">
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default ChatSidebarPanelChrome;
