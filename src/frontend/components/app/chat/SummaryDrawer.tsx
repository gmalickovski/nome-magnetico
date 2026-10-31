import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ChatReadingSummary,
  RadarAxesData,
  ResultPanelData,
  ReadingSummaryItem,
} from './chat-types.js';
import { ChatSidebarSection } from './ChatSidebarSection.js';

export interface SummaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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

const SWIPE_CLOSE_PX = 72;

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
  const [dragX, setDragX] = useState(0);
  const [entered, setEntered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setEntered(false);
      setDragX(0);
      return;
    }
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

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
      onClose();
    }
    setDragX(0);
    touchStartX.current = null;
  }, [dragX, onClose]);

  if (!isOpen) return null;

  const panelTransform = entered
    ? `translateX(${dragX}px)`
    : 'translateX(100%)';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] md:hidden"
    >
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="fixed right-0 top-0 bottom-0 z-10 flex w-[min(92vw,400px)] max-w-[400px] flex-col overflow-hidden border-l border-white/10 bg-chat-drawer shadow-2xl ease-out touch-pan-y"
        style={{
          transform: panelTransform,
          transition: dragX > 0 ? 'none' : 'transform 300ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-white/5 bg-chat-drawer/90 px-4 py-3 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden />
            <h2 className="nm-h4 truncate text-sm font-cinzel text-chat-ink">Painel de Leitura</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="shrink-0 rounded-full p-1.5 text-chat-muted transition hover:bg-white/5 hover:text-chat-ink"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <p className="px-4 pt-2 text-[10px] text-chat-muted md:hidden">
          Deslize para a direita para fechar
        </p>

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
