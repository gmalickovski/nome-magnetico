import React, { useEffect, useState } from 'react';
import AvatarMenu from './AvatarMenu.js';
import { CHAT_SESSION_CHANGED_EVENT, hasUnfinishedChatSession } from './chat/chat-session-storage.js';

export interface AppMobileHeaderProps {
  nome: string;
  isAdmin: boolean;
  userId?: string;
  showAnalysisCta?: boolean;
}

/** Compact visual avatar with a 44px touch target, centered brand and action. */
export default function AppMobileHeader({ nome, isAdmin, userId, showAnalysisCta = false }: AppMobileHeaderProps) {
  const [hasUnfinishedSession, setHasUnfinishedSession] = useState(false);
  useEffect(() => {
    const sync = () => setHasUnfinishedSession(Boolean(userId && hasUnfinishedChatSession(userId)));
    sync();
    window.addEventListener('pageshow', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    window.addEventListener(CHAT_SESSION_CHANGED_EVENT, sync);
    document.addEventListener('astro:page-load', sync);
    return () => {
      window.removeEventListener('pageshow', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', sync);
      window.removeEventListener(CHAT_SESSION_CHANGED_EVENT, sync);
      document.removeEventListener('astro:page-load', sync);
    };
  }, [userId, showAnalysisCta]);
  return (
    <header className="lg:hidden sticky top-0 z-40 h-[52px] nm-chat-compact-header border-b border-[#D4AF37]/20 bg-[#111111]/80 backdrop-blur-md">
      <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 px-3">
        <div className="justify-self-start"><AvatarMenu nome={nome} isAdmin={isAdmin} /></div>
        <a
          href="/app"
          className="flex min-h-11 items-center justify-center transition-opacity hover:opacity-80"
        >
          <img src="/logo-nm-header.svg" alt="Nome Magnético" className="h-9 w-auto max-w-[56vw] object-contain" />
        </a>
        <div className="min-w-0 justify-self-end">
          {showAnalysisCta && userId && (
            <a href="/app/analise/nome-social" data-nm-mobile-header-cta="analise"
              aria-label={hasUnfinishedSession ? 'Retomar análise' : 'Nova análise'}
              title={hasUnfinishedSession ? 'Retomar análise' : 'Nova análise'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37] text-[#131313] transition-colors duration-300 hover:bg-[#f2ca50] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bea5ff]">
              {/* DEV-317: mesma folha (família Lucide do sistema); "+" para nova, seta para retomar. */}
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                {hasUnfinishedSession ? (
                  <>
                    <path d="M8 14h7" />
                    <path d="m12.5 11 3 3-3 3" />
                  </>
                ) : (
                  <>
                    <path d="M12 11v6" />
                    <path d="M9 14h6" />
                  </>
                )}
              </svg>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
