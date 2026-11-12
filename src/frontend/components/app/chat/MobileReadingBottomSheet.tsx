import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ChatReadingSummary,
  RadarAxesData,
  ResultPanelData,
} from './chat-types.js';
import { ChatSidebarSection } from './ChatSidebarSection.js';
import { useFocusTrap } from './useFocusTrap.js';
import { IconX } from './MobileChatDockIcons.js';

export type ReadingSheetSnap = 'closed' | 'half' | 'full';
export type SummaryPanelCloseMethod = 'trigger' | 'x' | 'backdrop' | 'swipe' | 'escape';

export interface MobileReadingBottomSheetProps {
  snap: ReadingSheetSnap;
  onSnapChange: (snap: ReadingSheetSnap) => void;
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

export function MobileReadingBottomSheet({
  snap,
  onSnapChange,
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
}: MobileReadingBottomSheetProps) {
  const [mounted, setMounted] = useState(snap !== 'closed');
  const [entered, setEntered] = useState(snap !== 'closed');
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const dragStartY = useRef<number | null>(null);
  const reduced = prefersReducedMotion();

  const isOpen = snap !== 'closed';
  const isFull = snap === 'full';

  useFocusTrap(isOpen && isFull, dialogRef);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(frame);
    }
    setEntered(false);
    const ms = reduced ? 80 : 120;
    const t = window.setTimeout(() => setMounted(false), ms);
    return () => window.clearTimeout(t);
  }, [isOpen, reduced]);

  useEffect(() => {
    if (!mounted || !entered) return;
    titleRef.current?.focus();
  }, [mounted, entered, snap]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose('escape');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mounted, onClose]);

  const onHandlePointerDown = useCallback((e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onHandlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragStartY.current == null) return;
      const delta = e.clientY - dragStartY.current;
      dragStartY.current = null;
      if (delta > 48) {
        if (snap === 'full') onSnapChange('half');
        else onClose('swipe');
        return;
      }
      if (delta < -48) {
        if (snap === 'half') onSnapChange('full');
      }
    },
    [onClose, onSnapChange, snap]
  );

  if (!mounted) return null;

  const sheetHeight =
    snap === 'full'
      ? '92vh'
      : `min(50vh, calc(100vh - var(--nm-mobile-dock-clearance, 76px) - 24px))`;

  const sheetBottom = snap === 'full' ? '0px' : 'var(--nm-mobile-dock-clearance, 76px)';

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className={`nm-reading-sheet-overlay fixed inset-0 z-[62] bg-black/55 md:hidden ${
          entered ? 'nm-reading-sheet-overlay--open' : 'nm-reading-sheet-overlay--closed'
        }`}
        onClick={() => onClose('backdrop')}
      />
      <div
        ref={dialogRef}
        id="mobile-reading-summary"
        role="dialog"
        aria-modal={isFull ? 'true' : 'false'}
        aria-labelledby="mobile-summary-title"
        className={`nm-reading-sheet fixed inset-x-0 z-[63] flex flex-col overflow-hidden bg-[#1C1C1C] text-[#E5E2E1] md:hidden rounded-t-2xl ${
          entered ? 'nm-reading-sheet--open' : 'nm-reading-sheet--closed'
        } ${reduced ? 'nm-reading-sheet--reduced' : ''}`}
        style={{
          bottom: sheetBottom,
          height: sheetHeight,
          maxHeight: sheetHeight,
        }}
      >
        <div
          className="flex h-11 shrink-0 items-center justify-center touch-none"
          onPointerDown={onHandlePointerDown}
          onPointerUp={onHandlePointerUp}
        >
          <span className="h-1 w-9 rounded-full bg-[#A0A0A0]/60" aria-hidden="true" />
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4 pb-3">
          <h2
            ref={titleRef}
            id="mobile-summary-title"
            tabIndex={-1}
            className="font-cinzel text-base font-bold uppercase tracking-[0.12em] text-[#D4AF37] truncate"
          >
            Painel de leitura
          </h2>
          <button
            type="button"
            onClick={() => onClose('x')}
            aria-label="Fechar painel de leitura"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#1c1c1c] text-[#E5E2E1] hover:text-[#D4AF37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 chat-scroll-pane overscroll-contain px-4 py-3 text-[#E5E2E1]">
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
    </>
  );
}

export default MobileReadingBottomSheet;
