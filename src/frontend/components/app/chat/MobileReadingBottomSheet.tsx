import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ChatReadingSummary,
  RadarAxesData,
  ResultPanelData,
} from './chat-types.js';
import { ChatSidebarSection } from './ChatSidebarSection.js';
import { useFocusTrap } from './useFocusTrap.js';
import { IconFileDown, IconLockOpen, IconX } from './MobileChatDockIcons.js';
import {
  MOBILE_READING_OVERLAY_Z_INDEX,
  MOBILE_READING_SHEET_HEIGHT_FULL,
  MOBILE_READING_SHEET_HEIGHT_HALF,
  MOBILE_READING_SHEET_Z_INDEX,
} from './mobile-dock-layout.js';
import type { ChatPdfCtaModel } from './ChatPdfCta.js';

export type ReadingSheetSnap = 'closed' | 'half' | 'full';
export type SummaryPanelCloseMethod = 'trigger' | 'x' | 'backdrop' | 'swipe' | 'escape';

export interface ReadingSheetCardHeader {
  suggestedName: string;
  chosenScore: number;
  baseScore: number;
}

export interface ReadingPanelPrimaryCta {
  variant: 'pdf' | 'unlock';
  onClick: () => void;
  pdfModel?: ChatPdfCtaModel | null;
  pdfExiting?: boolean;
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
  panelPrimary?: ReadingPanelPrimaryCta | null;
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
  headerFromCard: _headerFromCard = null,
  scrollToHarmonizedOnEnter = false,
  onContentScrollMax,
  panelPrimary = null,
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

  useFocusTrap(isOpen, dialogRef);

  useEffect(() => {
    if (!isTabletOrPhone()) return undefined;
    document.documentElement.classList.toggle('nm-reading-panel-open', isOpen);
    return () => document.documentElement.classList.remove('nm-reading-panel-open');
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
    const ms = reduced ? 0 : 220;
    const t = window.setTimeout(() => setMounted(false), ms);
    return () => window.clearTimeout(t);
  }, [isOpen, reduced]);

  useEffect(() => {
    if (!mounted || !entered) return;
    titleRef.current?.focus();
  }, [mounted, entered, snap]);

  useEffect(() => {
    if (!mounted || !entered || !scrollToHarmonizedOnEnter) return;
    if (reduced) {
      document.getElementById('nm-reading-harmonized')?.scrollIntoView({ behavior: 'auto', block: 'start' });
      return;
    }
    const t = window.setTimeout(() => {
      document.getElementById('nm-reading-harmonized')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 280);
    return () => window.clearTimeout(t);
  }, [mounted, entered, scrollToHarmonizedOnEnter, reduced]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        !e.defaultPrevented &&
        !document.querySelector('[data-nm-modal="true"]')
      ) {
        onClose('escape');
      }
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
    if (dragStartY.current == null) return;
    const delta = e.clientY - dragStartY.current;
    setDragOffset(delta > 0 ? delta : 0);
  }, []);

  const onHandlePointerCancel = useCallback(() => {
    dragStartY.current = null;
    dragStartT.current = null;
    setDragging(false);
    setDragOffset(0);
  }, []);

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
        onClose('swipe');
        return;
      }
    },
    [onClose]
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

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className={`nm-reading-sheet-overlay fixed inset-0 bg-black/50 lg:hidden z-[55] ${
          entered ? 'nm-reading-sheet-overlay--open' : 'nm-reading-sheet-overlay--closed'
        } ${reduced ? 'nm-reading-sheet--reduced' : ''}`}
        style={{ zIndex: MOBILE_READING_OVERLAY_Z_INDEX }}
        onClick={() => onClose('backdrop')}
      />
      <div
        ref={dialogRef}
        id="mobile-reading-summary"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-summary-title"
        className={`nm-reading-sheet fixed inset-x-0 bottom-0 flex flex-col overflow-hidden bg-[#1C1C1C] text-[#E5E2E1] lg:hidden rounded-t-2xl z-[60] ${
          entered ? 'nm-reading-sheet--open' : 'nm-reading-sheet--closed'
        } ${reduced ? 'nm-reading-sheet--reduced' : ''} ${dragging ? 'nm-reading-sheet--dragging' : ''}`}
        style={{
          zIndex: MOBILE_READING_SHEET_Z_INDEX,
          height: sheetHeight,
          maxHeight: sheetHeight,
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
        }}
      >
        {/* DEV-310: o X fica na mesma linha do puxador, no canto superior direito; o puxador segue centralizado. */}
        <div className="relative h-11 w-full shrink-0">
          <div
            className="flex h-full w-full touch-none items-center justify-center"
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerCancel}
            aria-hidden="true"
          >
            <span className="h-1 w-9 rounded-full bg-[#A0A0A0]/60" style={{ width: 36, height: 4 }} />
          </div>
          <button
            type="button"
            onClick={() => onClose('x')}
            title="Fechar painel de análise"
            aria-label="Fechar painel de análise"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-transparent text-[#e5e2e1]/80 hover:text-[#f2ca50] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2ca50]/70"
          >
            <IconX className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-white/[0.06] px-4 pb-3">
          <div className="relative flex w-full items-center justify-center min-h-[32px]">
            <h2
              ref={titleRef}
              id="mobile-summary-title"
              tabIndex={-1}
              className="font-cinzel text-base font-bold uppercase tracking-[0.12em] text-[#e5e2e1] text-center px-4 truncate"
            >
              Painel de análise
            </h2>
          </div>
        </div>

        <div
          ref={contentRef}
          className="min-h-0 flex-1 chat-scroll-pane overscroll-contain text-[#E5E2E1]"
        >
          <div className="w-full mx-auto px-4 py-3 pb-4">
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

        {panelPrimary && (panelPrimary.pdfModel || panelPrimary.variant === 'unlock') ? (
          <div className="shrink-0 border-t border-white/[0.06] bg-[#1C1C1C]/95 backdrop-blur-md px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            {panelPrimary.variant === 'pdf' && panelPrimary.pdfModel ? (
              !panelPrimary.pdfModel.emailConfirmed || panelPrimary.pdfModel.phase === 'email_gate' ? (
                <div
                  className="flex w-full items-center justify-center rounded-full border border-[#F59E0B]/70 bg-[#131313]/95 px-4 py-2.5 text-xs font-semibold text-[#F59E0B]"
                  role="status"
                >
                  Confirme seu e-mail para gerar a análise
                </div>
              ) : (
                <button
                  type="button"
                  onClick={panelPrimary.onClick}
                  disabled={panelPrimary.pdfModel.phase === 'loading'}
                  aria-busy={panelPrimary.pdfModel.phase === 'loading'}
                  className={`inline-flex w-full min-h-[46px] items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold font-inter text-[#131313] shadow-[0_2px_16px_rgba(212,175,55,0.35)] hover:bg-[#f2ca50] active:scale-[0.98] transition-all duration-200 disabled:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] ${
                    panelPrimary.pdfModel.phase === 'error' ? 'ring-2 ring-[#FF6B6B]' : ''
                  }`}
                >
                  {panelPrimary.pdfModel.phase === 'loading' ? (
                    <svg
                      className="h-4 w-4 animate-spin shrink-0 text-[#131313]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <IconFileDown className="h-4 w-4 shrink-0 text-[#131313]" />
                  )}
                  <span>
                    {panelPrimary.pdfModel.phase === 'loading'
                      ? 'Gerando análise...'
                      : panelPrimary.pdfModel.phase === 'ready'
                        ? 'Baixar análise'
                        : 'Gerar análise'}
                  </span>
                </button>
              )
            ) : panelPrimary.variant === 'unlock' ? (
              <button
                type="button"
                onClick={panelPrimary.onClick}
                className="inline-flex w-full min-h-[46px] items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold font-inter text-[#131313] shadow-[0_2px_16px_rgba(212,175,55,0.35)] hover:bg-[#f2ca50] active:scale-[0.98] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
              >
                <IconLockOpen className="h-4 w-4 shrink-0 text-[#131313]" />
                <span>Desbloquear análise</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}

export default MobileReadingBottomSheet;
