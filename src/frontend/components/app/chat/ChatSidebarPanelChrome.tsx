import React, { type ReactNode } from 'react';

export interface ChatSidebarPanelChromeProps {
  expanded: boolean;
  onToggleExpand: () => void;
  children: ReactNode;
  className?: string;
}

export function ChatSidebarPanelChrome({
  expanded,
  onToggleExpand,
  children,
  className = '',
}: ChatSidebarPanelChromeProps) {
  return (
    <div className={`flex flex-col min-h-0 h-full ${className}`}>
      {/* Header com padding bottom aprimorado para separar do conteúdo */}
      <div className="shrink-0 flex items-center justify-between gap-3 pb-5 sm:pb-6 pt-1 px-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full bg-[#f2ca50] shadow-[0_0_10px_rgba(242,202,80,0.65)] shrink-0"
            aria-hidden="true"
          />
          <h2 className="font-cinzel text-base sm:text-lg md:text-xl font-bold uppercase tracking-[0.14em] text-[#e5e2e1] truncate">
            Painel de leitura
          </h2>
        </div>

        {/* Botão de expansão/recolhimento fixo em dimensões (w-10 h-10) com ícones canônicos */}
        <button
          type="button"
          onClick={onToggleExpand}
          className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/10 bg-[#1c1c1c] text-[#e5e2e1] hover:text-[#f2ca50] hover:border-[#f2ca50]/50 hover:bg-[#252525] active:scale-95 transition-all duration-200 flex items-center justify-center shadow-md shadow-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]/70"
          title={expanded ? 'Recolher painel (voltar ao chat)' : 'Expandir painel de leitura'}
          aria-label={expanded ? 'Recolher painel (voltar ao chat)' : 'Expandir painel de leitura'}
        >
          {expanded ? (
            /* Ícone canônico de recolher/fechar: 4 setas apontando para dentro (Heroicons ArrowsPointingIn) */
            <svg
              className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-200"
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
            /* Ícone canônico de expandir/abrir: 4 setas apontando para fora (Heroicons ArrowsPointingOut) */
            <svg
              className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-200"
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

      <div className="flex-1 min-h-0 chat-scroll-pane pt-0.5">{children}</div>
    </div>
  );
}

export default ChatSidebarPanelChrome;
