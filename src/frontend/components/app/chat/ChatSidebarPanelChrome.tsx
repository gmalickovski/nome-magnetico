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
      <div className="shrink-0 flex items-center justify-between gap-3 pb-3 px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f2ca50] shadow-[0_0_10px_rgba(242,202,80,0.65)] shrink-0" aria-hidden />
          <h2 className="font-cinzel text-base sm:text-lg md:text-xl font-bold uppercase tracking-[0.14em] text-[#e5e2e1] truncate">
            Painel de leitura
          </h2>
        </div>
        <button
          type="button"
          onClick={onToggleExpand}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#1c1c1c] px-3.5 py-1.5 text-xs font-inter text-[#e5e2e1] hover:text-white hover:border-[#f2ca50]/50 hover:bg-[#242424] transition-all shadow-sm"
          aria-label={expanded ? 'Voltar à vista com chat' : 'Expandir painel de leitura'}
        >
          {expanded ? (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V16a2 2 0 01-2 2h-1.586a1 1 0 01-.707-.293l-4.414-4.414A1 1 0 005 14.586V4z"
                  clipRule="evenodd"
                />
              </svg>
              Voltar ao chat
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l3.293 3.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-3.293 3.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l3.293-3.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-3.293-3.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Expandir
            </>
          )}
        </button>
      </div>
      <div className="flex-1 min-h-0 chat-scroll-pane">{children}</div>
    </div>
  );
}

export default ChatSidebarPanelChrome;
