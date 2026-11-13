import React from 'react';
import { IconScrollText } from './MobileChatDockIcons.js';

export function ChatReadingHeaderTrigger({
  badge,
  onOpen,
}: {
  badge: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      data-nm-reading-trigger="header"
      aria-label="Abrir painel de análise"
      onClick={onOpen}
      className="md:hidden flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 text-[#D4AF37] bg-[#131313] relative focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
    >
      <IconScrollText className="h-5 w-5" />
      {badge && (
        <span
          aria-label="Leitura atualizada"
          className="nm-reading-badge absolute right-1 top-1 h-2 w-2 rounded-full bg-[#D4AF37]"
        />
      )}
    </button>
  );
}
