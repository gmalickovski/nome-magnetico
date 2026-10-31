import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ChatReadingSummary,
  RadarAxesData,
  ResultPanelData,
  ReadingSummaryItem,
} from './chat-types.js';
import { ChatSidebarSection } from './ChatSidebarSection.js';
import { useFocusTrap } from './useFocusTrap.js';
import { IconChevronRight } from './MobileChatDockIcons.js';

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
  radarShowNumericLabels?: boolean;
  contextChips?: string[];
  summaryItems: ReadingSummaryItem[];
  showRadar: boolean;
  showSummary: boolean;
  readingSummary?: ChatReadingSummary | null;
  readingSummaryLoading?: boolean;
  showReadingSummary?: boolean;
}

const SWIPE_CLOSE_PX = 80;

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
  const [dragX, setDragX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(mounted && entered, dialogRef);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(frame);
    }
    setEntered(false);
    const t = window.setTimeout(() => setMounted(false), 240);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!mounted) {
      setDragX(0);
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose('x');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mounted, onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const x = e.touches[0]?.clientX ?? touchStartX.current;
    const delta = x - touchStartX.current;
    setDragX(Math.max(0, delta));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragX >= SWIPE_CLOSE_PX) {
      onClose('swipe');
    }
    setDragX(0);
    touchStartX.current = null;
  }, [dragX, onClose]);

  if (!mounted) return null;

  const panelTransform = entered ? `translateX(${dragX}px)` : 'translateX(100%)';
  const overlayOpacity = entered ? 1 : 0;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-summary-title"
      className="fixed inset-0 z-[64] md:hidden"
    >
      <div
        onClick={() => onClose('backdrop')}
        className="fixed inset-0 bg-black/50 backdrop-blur-[4px] transition-opacity duration-[240ms]"
        style={{
          opacity: overlayOpacity,
          transitionTimingFunction: entered ? 'cubic-bezier(0.32, 0.72, 0, 1)' : 'ease-out',
        }}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="fixed right-0 top-0 z-[65] flex h-[100dvh] w-[88vw] max-w-[420px] flex-col overflow-hidden rounded-l-[20px] border-l border-[rgba(212,175,55,0.18)] bg-[#131313] touch-pan-y"
        style={{
          transform: panelTransform,
          transition:
            dragX > 0
              ? 'none'
              : entered
                ? 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)'
                : 'transform 240ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div
          className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/5 bg-[#131313]/95 px-4 pb-3 backdrop-blur-md"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
        >
          <button
            type="button"
            onClick={() => onClose('x')}
            aria-label="Fechar resumo"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#A0A0A0] hover:bg-white/5 hover:text-[#e5e2e1]"
          >
            <IconChevronRight />
          </button>
          <h2 id="mobile-summary-title" className="nm-h3 text-[#D4AF37] truncate">
            Seu resumo
          </h2>
        </div>

        <div className="min-h-0 flex-1 chat-scroll-pane p-4 pt-2">
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
      </aside>
    </div>
  );
}

export default SummaryDrawer;
