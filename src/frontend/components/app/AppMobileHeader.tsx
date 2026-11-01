import React from 'react';
import AvatarMenu from './AvatarMenu.js';

export interface AppMobileHeaderProps {
  nome: string;
  isAdmin: boolean;
}

/** Header mobile único do /app: logo central + avatar (52px). */
export default function AppMobileHeader({ nome, isAdmin }: AppMobileHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-40 h-[52px] nm-chat-compact-header border-b border-[#D4AF37]/20 bg-[#111111]/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-full max-w-[1440px] items-center px-4">
        <a
          href="/app"
          className="absolute left-1/2 -translate-x-1/2 transition-opacity hover:opacity-80"
        >
          <img src="/logo-nm-header.svg" alt="Nome Magnético" className="h-8 w-auto" />
        </a>
        <div className="ml-auto flex items-center justify-end">
          <div className="flex h-9 w-9 items-center justify-center">
            <AvatarMenu nome={nome} isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </header>
  );
}
