import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { MobileDockLayout, DockPrimaryActionId, DockSecondaryActionId } from './mobile-dock-screen.js';
import { dockIconFor, IconScrollText } from './MobileChatDockIcons.js';
import { dockShellWidthStyle, MOBILE_DOCK_BAR_CLASS, MOBILE_DOCK_ROOT_CLASS } from './mobile-dock-layout.js';
import { useDockBarWidth } from './useDockBarWidth.js';
import { dockLayoutHasVisibleActions } from './mobile-dock-screen.js';
import { ChatPdfDockCircle, type ChatPdfCtaModel } from './ChatPdfCta.js';
import { DockTooltipButton } from './DockTooltipButton.js';
import {
  collectDockContextualActions,
  partitionDockContextualActions,
  type DockContextualAction,
} from './dock-contextual-actions.js';
import {
  DockContextScrollStrip,
  type DockContextScrollStripHandle,
} from './DockContextScrollStrip.js';
import { capturePostHogEvent } from '../../../lib/analytics.js';

export interface MobileChatDockProps {
  omitRoot?: boolean;
  layout: MobileDockLayout | null;
  summaryPanelOpen: boolean;
  restartExitActive?: boolean;
  summaryBadge: boolean;
  showReadingAction?: boolean;
  pdfModel?: ChatPdfCtaModel | null;
  pdfExiting?: boolean;
  onPdfClick?: () => void;
  onSecondary: (action: DockSecondaryActionId, position: number) => void;
  onPrimary: (action: DockPrimaryActionId) => void;
}

const CONTEXT_BTN =
  'mobile-chat-dock-btn relative flex h-11 w-11 shrink-0 snap-start scroll-ml-0 items-center justify-center rounded-full text-[#D4AF37] transition-[transform,background-color,color] duration-150 active:scale-[0.92] active:bg-[#D4AF37]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#D4AF37]';

const PRIMARY_BTN =
  CONTEXT_BTN + ' mobile-chat-dock-primary bg-[#D4AF37] text-[#111111] disabled:opacity-45';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function dockSurface(layout: MobileDockLayout): 'app' | 'resultado' {
  return layout.screen === 'resultado' ? 'resultado' : 'app';
}

export function MobileChatDock({
  omitRoot = false,
  layout,
  summaryPanelOpen = false,
  restartExitActive = false,
  summaryBadge,
  showReadingAction = false,
  pdfModel = null,
  pdfExiting = false,
  onPdfClick,
  onSecondary,
  onPrimary,
}: MobileChatDockProps) {
  const reduced = prefersReducedMotion();
  const [readingBadgePulse, setReadingBadgePulse] = useState(false);
  const scrollStripRef = useRef<DockContextScrollStripHandle>(null);
  const surface = layout ? dockSurface(layout) : 'app';

  useEffect(() => {
    if (!summaryBadge || reduced) return;
    setReadingBadgePulse(true);
    const t = window.setTimeout(() => setReadingBadgePulse(false), 700);
    return () => window.clearTimeout(t);
  }, [summaryBadge, reduced]);

  const measureKey =
    JSON.stringify(layout) + String(showReadingAction) + String(summaryBadge) + String(summaryPanelOpen);
  const { innerRef, widthPx } = useDockBarWidth(measureKey);

  const firePrimaryCta = useCallback(
    (cta: 'unlock' | 'pdf', location: 'dock') => {
      capturePostHogEvent('primary_cta_click', { cta, location, surface });
    },
    [surface]
  );

  const fireAction = useCallback(
    (item: DockContextualAction, index: number, inScroll: boolean) => {
      if (item.kind === 'primary' && item.primaryId) {
        if (item.primaryId === 'unlock_nome_social') firePrimaryCta('unlock', 'dock');
        else if (item.primaryId === 'download_pdf' || item.primaryId === 'generate_pdf') {
          firePrimaryCta('pdf', 'dock');
        }
        onPrimary(item.primaryId);
        return;
      }
      if (item.kind === 'pdf') {
        firePrimaryCta('pdf', 'dock');
        onPdfClick?.();
        return;
      }
      if (item.secondaryId) {
        const visibleWithoutScroll = inScroll
          ? scrollStripRef.current?.isItemFullyVisible(item.key) ?? true
          : true;
        capturePostHogEvent('dock_item_click', {
          item: item.secondaryId,
          position: index,
          visible_without_scroll: visibleWithoutScroll,
          surface,
        });
        onSecondary(item.secondaryId, index);
      }
    },
    [firePrimaryCta, onPdfClick, onPrimary, onSecondary, surface]
  );

  if (
    !layout ||
    !dockLayoutHasVisibleActions(layout, {
      pdfVisible: Boolean(pdfModel?.visible),
      pdfExiting,
      readingVisible: showReadingAction,
    })
  ) {
    return null;
  }

  const allActions = collectDockContextualActions(layout, {
    pdfModel,
    pdfExiting,
    reading: showReadingAction
      ? { visible: true, badge: summaryBadge }
      : undefined,
  });
  const { scrollable, fixed } = partitionDockContextualActions(allActions);

  const renderAction = (item: DockContextualAction, index: number, inScroll: boolean) => {
    if (item.kind === 'pdf' && pdfModel && onPdfClick) {
      return (
        <ChatPdfDockCircle
          key={item.key}
          model={pdfModel}
          onClick={() => {
            firePrimaryCta('pdf', 'dock');
            onPdfClick();
          }}
          exiting={pdfExiting}
          tooltip={
            pdfModel.isFree
              ? 'Desbloquear análise'
              : pdfModel.assinaturaLabel?.trim()
                ? 'PDF deste nome'
                : 'Baixar PDF'
          }
        />
      );
    }

    const Icon =
      item.kind === 'reading' ? IconScrollText : item.icon ? dockIconFor(item.icon) : IconScrollText;
    const isRestartExit = item.secondaryId === 'restart' && restartExitActive;
    const isPdfPrimary =
      item.kind === 'primary' &&
      (item.primaryId === 'download_pdf' || item.primaryId === 'generate_pdf');
    const className =
      (item.primaryGold ? PRIMARY_BTN : CONTEXT_BTN) + (isRestartExit ? ' mobile-chat-dock-btn--exit' : '');

    const aria =
      isPdfPrimary && item.primaryId === 'download_pdf'
        ? 'Baixar a análise em PDF'
        : item.label;

    return (
      <DockTooltipButton
        key={item.key}
        tooltip={isPdfPrimary ? 'Baixar PDF' : item.label}
        aria-label={aria}
        disabled={item.disabled}
        data-nm-reading-trigger={item.kind === 'reading' ? 'true' : undefined}
        data-dock-scroll-item={inScroll ? item.key : undefined}
        onClick={() => fireAction(item, index, inScroll)}
        style={reduced ? undefined : { animationDelay: `${index * 30}ms` }}
        className={className}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {item.badge && (
          <span
            aria-label="Leitura atualizada"
            className={`nm-reading-badge absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#D4AF37] motion-reduce:animate-none${
              readingBadgePulse && item.kind === 'reading' ? ' nm-reading-badge--pulse' : ''
            }`}
          />
        )}
      </DockTooltipButton>
    );
  };

  const activeSelector =
    summaryPanelOpen && showReadingAction ? '[data-nm-reading-trigger]' : null;

  const content = (
    <div
      className={`${
        omitRoot ? 'inline-flex min-w-0 shrink' : 'flex min-w-0 max-w-full flex-1'
      } items-center gap-1 nm-dock-context-actions ${
        reduced ? 'mobile-chat-dock-actions--reduced' : 'mobile-chat-dock-actions'
      }`}
    >
      {scrollable.length > 0 ? (
        <DockContextScrollStrip ref={scrollStripRef} surface={surface} activeItemSelector={activeSelector}>
          {scrollable.map((item, index) => renderAction(item, index, true))}
        </DockContextScrollStrip>
      ) : !omitRoot ? (
        <span className="min-w-0 flex-1" aria-hidden="true" />
      ) : null}
      {fixed.length > 0 ? (
        <div className="nm-dock-context-fixed inline-flex shrink-0 items-center gap-1">
          {fixed.map((item, index) => renderAction(item, scrollable.length + index, false))}
        </div>
      ) : null}
    </div>
  );

  if (omitRoot) return content;
  return (
    <div className={MOBILE_DOCK_ROOT_CLASS} role="toolbar" aria-label="Ações">
      <div className="mobile-chat-dock-shell rounded-[28px]" style={dockShellWidthStyle(widthPx, reduced)}>
        <div ref={innerRef} className={MOBILE_DOCK_BAR_CLASS}>
          {content}
        </div>
      </div>
    </div>
  );
}
export default MobileChatDock;
