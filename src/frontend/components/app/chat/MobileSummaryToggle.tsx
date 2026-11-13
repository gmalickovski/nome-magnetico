import React from 'react';
import { IconChevronLeft } from './MobileChatDockIcons.js';

export function MobileSummaryToggle({ open, badge, onToggle }: { open: boolean; badge: boolean; onToggle: () => void }) {
  const label = open ? 'Fechar painel de análise' : 'Abrir painel de análise';
  return (
    <button type="button" data-nm-summary-toggle aria-label={label} title={label} aria-expanded={open} aria-controls="mobile-reading-summary" onClick={onToggle}
      className="fixed right-0 z-[72] flex h-12 w-11 items-center justify-center rounded-l-2xl bg-[#252525] text-[#f2ca50] shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition-colors hover:bg-[#303030] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2ca50] md:hidden"
      style={{ bottom: 'calc(var(--nm-mobile-dock-clearance, 76px) + 12px)', right: 'env(safe-area-inset-right, 0px)' }}>
      <span className={open ? 'rotate-180 transition-transform duration-200 motion-reduce:transition-none' : 'transition-transform duration-200 motion-reduce:transition-none'}><IconChevronLeft /></span>
      {badge && !open && <span aria-hidden="true" className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#f2ca50]" />}
      <span className="sr-only">{badge && !open ? 'Resumo atualizado' : ''}</span>
    </button>
  );
}
