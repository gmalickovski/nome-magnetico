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
          <img src="/logo-nm-header.svg" alt="Nome Magnético" className="h-auto w-[88px] min-[360px]:w-[124px] min-[390px]:w-[140px] sm:w-[160px]" />
        </a>
        <div className="min-w-0 justify-self-end">
          {showAnalysisCta && userId && (
            <a href="/app/analise/nome-social" data-nm-mobile-header-cta="analise"
              className="relative isolate inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-2 text-[11px] font-semibold text-[#131313] before:absolute before:inset-x-0 before:inset-y-1.5 before:-z-10 before:rounded-full before:bg-[#D4AF37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bea5ff]">
              {hasUnfinishedSession ? 'Retomar Análise' : 'Nova Análise'}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
