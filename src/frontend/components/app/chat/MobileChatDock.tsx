import React from 'react';
import type { MobileDockLayout, DockPrimaryActionId, DockSecondaryActionId } from './mobile-dock-screen.js';
import { IconChevronLeft, dockIconFor } from './MobileChatDockIcons.js';
import { dockShellWidthStyle, MOBILE_DOCK_BAR_CLASS, MOBILE_DOCK_ROOT_CLASS } from './mobile-dock-layout.js';
import { useDockBarWidth } from './useDockBarWidth.js';
import { ChatPdfDockCircle, type ChatPdfCtaModel } from './ChatPdfCta.js';
import { DockTooltipButton } from './DockTooltipButton.js';

export interface MobileChatDockProps {
  /** Ações sem outro shell quando incorporadas à navegação global. */
  omitRoot?: boolean;
  layout: MobileDockLayout | null;
  summaryPanelOpen: boolean;
  restartExitActive?: boolean;
  summaryBadge: boolean;
  pdfModel?: ChatPdfCtaModel | null;
  pdfExiting?: boolean;
  onPdfClick?: () => void;
  onBack: () => void;
  onSecondary: (action: DockSecondaryActionId, position: number) => void;
  onPrimary: (action: DockPrimaryActionId) => void;
}
const ACTION_BUTTON = 'mobile-chat-dock-btn relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#A0A0A0] transition-[transform,background-color,color] duration-150 active:scale-[0.92] active:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#D4AF37]';

export function MobileChatDock({ omitRoot = false, layout, restartExitActive = false, pdfModel = null, pdfExiting = false, onPdfClick, onBack, onSecondary, onPrimary }: MobileChatDockProps) {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { innerRef, widthPx } = useDockBarWidth(JSON.stringify(layout));
  if (!layout) return null;
  const secondaries = layout.screen === 'resultado' ? layout.secondaries : layout.middleSecondaries;
  const primary = layout.primary;
  const PrimaryIcon = primary ? dockIconFor(primary.icon) : null;
  const content = (
    <div className={`inline-flex w-max shrink-0 items-center gap-1 ${reduced ? 'mobile-chat-dock-actions--reduced' : 'mobile-chat-dock-actions'}`}>
      <DockTooltipButton tooltip="Voltar" aria-label="Voltar" onClick={onBack} className={ACTION_BUTTON + ' mobile-chat-dock-btn--back'}><IconChevronLeft /></DockTooltipButton>
      {secondaries.map((action, index) => {
        const Icon = dockIconFor(action.icon);
        return (
          <DockTooltipButton key={action.id} tooltip={action.label} aria-label={action.label} onClick={() => onSecondary(action.id, index)}
            style={reduced ? undefined : { animationDelay: `${index * 30}ms` }}
            className={ACTION_BUTTON + (action.id === 'restart' && restartExitActive ? ' mobile-chat-dock-btn--exit' : '')}><Icon /></DockTooltipButton>
        );
      })}
      {primary && PrimaryIcon && (
        <DockTooltipButton tooltip={primary.label} aria-label={primary.label} disabled={primary.disabled} onClick={() => onPrimary(primary.id)}
          className={ACTION_BUTTON + ' mobile-chat-dock-primary bg-[#D4AF37] text-[#111111] disabled:opacity-45'}>
          <PrimaryIcon />
        </DockTooltipButton>
      )}
      {layout.screen !== 'resultado' && pdfModel && (pdfModel.visible || pdfExiting) && onPdfClick && (
        <ChatPdfDockCircle model={pdfModel} onClick={onPdfClick} exiting={pdfExiting} tooltip={pdfModel.isFree ? 'Desbloquear análise' : 'Baixar PDF'} />
      )}
    </div>
  );
  if (omitRoot) return content;
  return <div className={MOBILE_DOCK_ROOT_CLASS} role="toolbar" aria-label="Ações">
    <div className="mobile-chat-dock-shell rounded-[28px]" style={dockShellWidthStyle(widthPx, reduced)}>
      <div ref={innerRef} className={MOBILE_DOCK_BAR_CLASS}>{content}</div>
    </div>
  </div>;
}
export default MobileChatDock;
