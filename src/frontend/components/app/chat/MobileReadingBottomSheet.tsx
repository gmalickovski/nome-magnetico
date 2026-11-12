import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ChatReadingSummary,
  RadarAxesData,
  ResultPanelData,
} from './chat-types.js';
import { ChatSidebarSection } from './ChatSidebarSection.js';
import { useFocusTrap } from './useFocusTrap.js';
import { IconX } from './MobileChatDockIcons.js';
import {
  MOBILE_READING_OVERLAY_Z_INDEX,
  MOBILE_READING_SHEET_HEIGHT_FULL,
  MOBILE_READING_SHEET_HEIGHT_HALF,
  MOBILE_READING_SHEET_Z_INDEX,
} from './mobile-dock-layout.js';
import { NM_MOBILE_DOCK_CLEARANCE } from '../mobile-dock-tokens.js';

export type ReadingSheetSnap = 'closed' | 'half' | 'full';
export type SummaryPanelCloseMethod = 'trigger' | 'x' | 'backdrop' | 'swipe' | 'escape';

export interface ReadingSheetCardHeader {
  suggestedName: string;
  chosenScore: number;
  baseScore: number;
}

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
  headerFromCard?: ReadingSheetCardHeader | null;
  scrollToHarmonizedOnEnter?: boolean;
  onContentScrollMax?: (maxPct: number) => void;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isTabletOrPhone(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(max-width: 1023px)').matches;
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
  headerFromCard = null,
  scrollToHarmonizedOnEnter = false,
  onContentScrollMax,
}: MobileReadingBottomSheetProps) {
  const [mounted, setMounted] = useState(snap !== 'closed');
  const [entered, setEntered] = useState(snap !== 'closed');
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragStartT = useRef<number | null>(null);
  const maxScrollPctRef = useRef(0);
  const reduced = prefersReducedMotion();

  const isOpen = snap !== 'closed';
  const isFull = snap === 'full';
  const showCardHeader = Boolean(headerFromCard?.suggestedName?.trim());

  useFocusTrap(isOpen && isFull, dialogRef);

  useEffect(() => {
    if (!isTabletOrPhone()) return undefined;
    const root = document.querySelector('[data-nm-mobile-dock="single"]');
    if (isOpen) root?.classList.add('nm-mobile-dock--sheet-open');
    else root?.classList.remove('nm-mobile-dock--sheet-open');
    return () => root?.classList.remove('nm-mobile-dock--sheet-open');
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      maxScrollPctRef.current = 0;
      const frame = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(frame);
    }
    setEntered(false);
    setDragOffset(0);
    setDragging(false);
    const ms = reduced ? 150 : 220;
    const t = window.setTimeout(() => setMounted(false), ms);
    return () => window.clearTimeout(t);
  }, [isOpen, reduced]);

  useEffect(() => {
    if (!mounted || !entered) return;
    titleRef.current?.focus();
  }, [mounted, entered, snap, showCardHeader]);

  useEffect(() => {
    if (!mounted || !entered || !scrollToHarmonizedOnEnter) return;
    const t = window.setTimeout(() => {
      document.getElementById('nm-reading-harmonized')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }, reduced ? 0 : 280);
    return () => window.clearTimeout(t);
  }, [mounted, entered, scrollToHarmonizedOnEnter, reduced]);

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
    dragStartT.current = performance.now();
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onHandlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragStartY.current == null || !dragging) return;
    const delta = Math.max(0, e.clientY - dragStartY.current);
    setDragOffset(delta);
  }, [dragging]);

  const onHandlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragStartY.current == null) return;
      const delta = e.clientY - dragStartY.current;
      const dt = dragStartT.current ? Math.max(1, performance.now() - dragStartT.current) : 1;
      const velocity = delta / dt;
      dragStartY.current = null;
      dragStartT.current = null;
      setDragging(false);
      setDragOffset(0);

      const sheetEl = dialogRef.current;
      const sheetHeight = sheetEl?.offsetHeight ?? window.innerHeight * 0.92;
      const dismissByDistance = delta > sheetHeight * 0.3;
      const dismissByVelocity = velocity > 1.2 && delta > 24;

      if (delta > 48 || dismissByDistance || dismissByVelocity) {
        if (snap === 'full' && !dismissByDistance && !dismissByVelocity && delta <= sheetHeight * 0.3) {
          onSnapChange('half');
        } else {
          onClose('swipe');
        }
        return;
      }
      if (delta < -48) {
        if (snap === 'half') onSnapChange('full');
      }
    },
    [onClose, onSnapChange, snap]
  );

  const onContentScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return;
    const pct = Math.min(100, Math.round((el.scrollTop / max) * 100));
    if (pct > maxScrollPctRef.current) {
      maxScrollPctRef.current = pct;
      onContentScrollMax?.(pct);
    }
  }, [onContentScrollMax]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handler = () => onContentScroll();
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [mounted, onContentScroll]);

  if (!mounted) return null;

  const sheetHeight = snap === 'full' ? MOBILE_READING_SHEET_HEIGHT_FULL : MOBILE_READING_SHEET_HEIGHT_HALF;
  const showAboveScoreLine =
    showCardHeader &&
    headerFromCard &&
    headerFromCard.chosenScore > headerFromCard.baseScore;

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className={`nm-reading-sheet-overlay fixed inset-0 bg-black/50 lg:hidden ${
          `z-[${MOBILE_READING_OVERLAY_Z_INDEX}] `
        }${
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
        className={`nm-reading-sheet fixed inset-x-0 bottom-0 flex flex-col overflow-hidden bg-[#1C1C1C] text-[#E5E2E1] lg:hidden rounded-t-2xl ${
          `z-[${MOBILE_READING_SHEET_Z_INDEX}] `
        }${
          entered ? 'nm-reading-sheet--open' : 'nm-reading-sheet--closed'
        } ${reduced ? 'nm-reading-sheet--reduced' : ''} ${dragging ? 'nm-reading-sheet--dragging' : ''}`}
        style={{
          height: sheetHeight,
          maxHeight: sheetHeight,
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
        }}
      >
        <div
          className="flex h-11 shrink-0 items-center justify-center touch-none"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
        >
          <span className="h-1 w-9 rounded-full bg-[#A0A0A0]/60" aria-hidden="true" />
        </div>

        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/[0.06] px-4 pb-3">
          <div className="min-w-0 flex-1">
            {showCardHeader && headerFromCard ? (
              <>
                <p className="text-[10px] font-cinzel uppercase tracking-[0.14em] text-[#A0A0A0]">
                  Leitura deste nome
                </p>
                <h2
                  ref={titleRef}
                  id="mobile-summary-title"
                  tabIndex={-1}
                  className="font-cinzel text-xl font-bold text-[#D4AF37] truncate mt-0.5"
                >
                  {headerFromCard.suggestedName}
                </h2>
                {showAboveScoreLine && (
                  <p className="text-xs text-[#A0A0A0] mt-1 leading-snug">
                    Nota {headerFromCard.chosenScore} · acima da do seu nome de nascimento (
                    {headerFromCard.baseScore})
                  </p>
                )}
              </>
            ) : (
              <h2
                ref={titleRef}
                id="mobile-summary-title"
                tabIndex={-1}
                className="font-cinzel text-base font-bold uppercase tracking-[0.12em] text-[#D4AF37] truncate"
              >
                Painel de leitura
              </h2>
            )}
          </div>
          <button
            type="button"
            onClick={() => onClose('x')}
            aria-label={showCardHeader ? 'Fechar leitura' : 'Fechar painel de leitura'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#1c1c1c] text-[#E5E2E1] hover:text-[#D4AF37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={contentRef}
          className="min-h-0 flex-1 chat-scroll-pane nm-dock-scroll-clearance overscroll-contain px-4 py-3 text-[#E5E2E1]"
          style={{ paddingBottom: `calc(${NM_MOBILE_DOCK_CLEARANCE} + 8px)` }}
        >
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
