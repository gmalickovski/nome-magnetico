import React, { useEffect, useRef, useState } from 'react';
import type {
  ChatReadingSummary,
  RadarAxesData,
  ResultPanelData,
} from './chat-types.js';
import { ChatSidebarSection } from './ChatSidebarSection.js';
import { useFocusTrap } from './useFocusTrap.js';
import { IconX } from './MobileChatDockIcons.js';

export type SummaryPanelCloseMethod = 'trigger' | 'x' | 'backdrop' | 'swipe' | 'escape';

export interface SummaryDrawerProps {
  isOpen: boolean;
  onClose: (method: SummaryPanelCloseMethod) => void;
  birthPanel: ResultPanelData | null;
  harmonizedPanel?: ResultPanelData | null;
  showScoreCard: boolean;
  showStarDetail: boolean;
  starPanelData: ResultPanelData | null;
  isSuggestion?: boolean;
  onResetToBase?: () => void;
  radarAxes: RadarAxesData | null;
  radarOverlayAxes?: RadarAxesData | null;
  radarLabels?: Record<string, string>;
  radarShowNumericLabels?: boolean;
  contextChips?: string[];
  showRadar: boolean;
  readingSummary?: ChatReadingSummary | null;
  readingSummaryLoading?: boolean;
  showReadingSummary?: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function SummaryDrawer({
  isOpen,
  onClose,
  birthPanel,
  harmonizedPanel = null,
  showScoreCard,
  showStarDetail,
  starPanelData,
  isSuggestion = false,
  onResetToBase,
  radarAxes,
  radarOverlayAxes = null,
  radarLabels,
  radarShowNumericLabels = false,
  contextChips = [],
  showRadar,
  readingSummary = null,
  readingSummaryLoading = false,
  showReadingSummary = false,
}: SummaryDrawerProps) {
  const [mounted, setMounted] = useState(isOpen);
  const [entered, setEntered] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const reduced = prefersReducedMotion();

  useFocusTrap(mounted && entered, dialogRef);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(frame);
    }
    setEntered(false);
    const ms = reduced ? 80 : 200;
    const t = window.setTimeout(() => setMounted(false), ms);
    return () => window.clearTimeout(t);
  }, [isOpen, reduced]);

  useEffect(() => {
    if (!mounted || !entered) return;
    closeBtnRef.current?.focus();
  }, [mounted, entered]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose('escape');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mounted, onClose]);

  if (!mounted) return null;

  const panelClass = [
    'mobile-summary-fullscreen fixed inset-x-0 z-[64] flex flex-col overflow-hidden bg-[#131313] md:hidden',
    entered ? 'mobile-summary-fullscreen--open' : 'mobile-summary-fullscreen--closed',
    reduced ? 'mobile-summary-fullscreen--reduced' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={dialogRef}
      id="mobile-reading-summary"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-summary-title"
      className={panelClass}
      style={{
        top: 'var(--nm-chat-mobile-header-h, 52px)',
        bottom: 0,
      }}
    >
      {/* Header bar mobile alinhado com o design system (PAINEL DE ANÁLISE + botão de fechar) */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 bg-[#131313]/95 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full bg-[#f2ca50] shadow-[0_0_10px_rgba(242,202,80,0.65)] shrink-0"
            aria-hidden="true"
          />
          <h2
            id="mobile-summary-title"
            className="font-cinzel text-base sm:text-lg font-bold uppercase tracking-[0.14em] text-[#e5e2e1] truncate"
          >
            Painel de análise
          </h2>
        </div>
        <button
          ref={closeBtnRef}
          type="button"
          onClick={() => onClose('x')}
          aria-label="Fechar painel de análise e voltar ao chat"
          title="Fechar painel de análise"
          className="w-11 h-11 rounded-full border border-white/10 bg-[#1c1c1c] text-[#e5e2e1] hover:text-[#f2ca50] hover:border-[#f2ca50]/50 hover:bg-[#252525] active:scale-95 transition-colors duration-150 flex items-center justify-center shadow-md shadow-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]/70 shrink-0"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>

      {/* Container de scroll fullscreen cobrindo 100% da viewport, com dock flutuando por cima e padding inferior calibrado */}
      <div
        className="min-h-0 flex-1 chat-scroll-pane overscroll-contain px-3.5 sm:px-6 py-4"
        style={{
          paddingBottom: 'calc(var(--nm-chat-dock-clearance, 76px) + 2rem)',
        }}
      >
        <div className="w-full max-w-[580px] mx-auto flex flex-col gap-4">
          <ChatSidebarSection
          birthPanel={birthPanel}
          harmonizedPanel={harmonizedPanel}
          showScoreCard={showScoreCard}
          showStarDetail={showStarDetail}
          starPanelData={starPanelData}
          isSuggestion={isSuggestion}
          onResetToBase={onResetToBase}
          radarAxes={radarAxes}
          radarOverlayAxes={radarOverlayAxes}
          radarLabels={radarLabels}
          radarShowNumericLabels={radarShowNumericLabels}
          contextChips={contextChips}
          showRadar={showRadar}
          readingSummary={readingSummary}
          readingSummaryLoading={readingSummaryLoading}
          showReadingSummary={showReadingSummary}
        />
        </div>
      </div>
    </div>
  );
}

export default SummaryDrawer;
