import React, { useEffect, useRef, useState } from 'react';
import type {
  ChatReadingSummary,
  RadarAxesData,
  ResultPanelData,
  ReadingSummaryItem,
} from './chat-types.js';
import { ChatSidebarSection } from './ChatSidebarSection.js';
import { useFocusTrap } from './useFocusTrap.js';
import { IconX } from './MobileChatDockIcons.js';

export type SummaryPanelCloseMethod = 'dock' | 'x' | 'backdrop' | 'swipe' | 'escape';

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
  summaryItems: ReadingSummaryItem[];
  showRadar: boolean;
  showSummary: boolean;
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
  summaryItems,
  showRadar,
  showSummary,
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-summary-title"
      className={panelClass}
      style={{
        top: 'var(--nm-chat-mobile-header-h, 52px)',
        bottom: 'var(--nm-chat-dock-clearance, var(--nm-mobile-dock-stacked-clearance))',
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-3 py-2.5">
        <h2 id="mobile-summary-title" className="nm-h3 text-[#D4AF37] truncate pl-1">
          Resumo
        </h2>
        <button
          ref={closeBtnRef}
          type="button"
          onClick={() => onClose('x')}
          aria-label="Fechar resumo e voltar ao chat"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#76746a] transition-colors hover:bg-white/[0.05] hover:text-[#e5e2e1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]/50 focus-visible:outline-offset-2"
        >
          <IconX className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="min-h-0 flex-1 chat-scroll-pane overscroll-contain px-3 py-3 pb-4">
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
          summaryItems={summaryItems}
          showSummary={showSummary}
          readingSummary={readingSummary}
          readingSummaryLoading={readingSummaryLoading}
          showReadingSummary={showReadingSummary}
        />
      </div>
    </div>
  );
}

export default SummaryDrawer;
