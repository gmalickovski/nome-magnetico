import React, { useEffect, useMemo } from 'react';
import type { MobileDockLayout } from './mobile-dock-screen.js';
import type { DockPrimaryActionId, DockSecondaryActionId } from './mobile-dock-screen.js';
import { IconChevronLeft, dockIconFor } from './MobileChatDockIcons.js';
import {
  dockShellWidthStyle,
  MOBILE_DOCK_BAR_CLASS,
  MOBILE_DOCK_ROOT_CLASS,
} from './mobile-dock-layout.js';
import { useDockBarWidth } from './useDockBarWidth.js';
import { ChatPdfDockCircle, type ChatPdfCtaModel } from './ChatPdfCta.js';
import { DockTooltipButton } from './DockTooltipButton.js';

export interface MobileChatDockProps {
  layout: MobileDockLayout | null;
  summaryPanelOpen: boolean;
  /** Recomeçar saindo da dock (Resumo aberto, antes de encolher). */
  restartExitActive?: boolean;
  summaryBadge: boolean;
  pdfModel?: ChatPdfCtaModel | null;
  pdfExiting?: boolean;
  onPdfClick?: () => void;
  onBack: () => void;
  onSecondary: (action: DockSecondaryActionId, position: number) => void;
  onPrimary: (action: DockPrimaryActionId) => void;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function MobileChatDock({
  layout,
  summaryPanelOpen,
  restartExitActive = false,
  summaryBadge,
  pdfModel = null,
  pdfExiting = false,
  onPdfClick,
  onBack,
  onSecondary,
  onPrimary,
}: MobileChatDockProps) {
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);

  const layoutMeasureKey = useMemo(() => {
    if (!layout) return '';
    if (layout.screen === 'resultado') {
      return [
        layout.screen,
        ...layout.secondaries.map((s) => s.id),
        layout.primary.id,
        layout.primary.disabled ? 'd' : 'e',
      ].join('|');
    }
    return [
      layout.screen,
      ...layout.middleSecondaries.map((s) => s.id),
      layout.showPdfCircle ? 'pdf' : '',
      pdfExiting ? 'pdf-x' : '',
      summaryPanelOpen ? 'open' : 'closed',
    ].join('|');
  }, [layout, summaryPanelOpen, pdfExiting]);

  const { innerRef, widthPx } = useDockBarWidth(layoutMeasureKey);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setKeyboardOpen(window.innerHeight - vv.height > 100);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  if (!layout) return null;

  const reduced = prefersReducedMotion();
  const hiddenByKeyboard = keyboardOpen;
  const shellStyle = dockShellWidthStyle(widthPx, reduced);

  const rootClass = `${MOBILE_DOCK_ROOT_CLASS} transition-opacity duration-[120ms] ${
    hiddenByKeyboard ? 'opacity-0 pointer-events-none' : 'opacity-100'
  }`;

  const SummaryIcon = dockIconFor('panel-right');

  const dockSecondaryBtnClass = (actionId: string, base: string) =>
    `${base}${actionId === 'restart' && restartExitActive ? ' mobile-chat-dock-btn--exit' : ''}`;

  if (layout.screen === 'chat_free_paywall' && layout.primary) {
    const primary = layout.primary;
    return (
      <div className={rootClass} role="toolbar" aria-label="Ações">
        <div className="mobile-chat-dock-shell rounded-[28px]" style={shellStyle}>
          <div
            ref={innerRef}
            className={`${MOBILE_DOCK_BAR_CLASS} supports-[backdrop-filter]:bg-[rgba(19,19,19,0.72)] [@media(not((-webkit-backdrop-filter:none))):not((backdrop-filter:none))):bg-[#131313]`}
          >
            <DockTooltipButton tooltip="Voltar" aria-label="Voltar" onClick={onBack} className="mobile-chat-dock-btn mobile-chat-dock-btn--back relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#A0A0A0] active:scale-[0.92] active:bg-white/[0.06]">
              <IconChevronLeft />
            </DockTooltipButton>
            <span className="mx-1.5 h-6 w-px shrink-0 bg-white/[0.12]" aria-hidden />
            <div className={`inline-flex shrink-0 items-center gap-1 ${reduced ? 'mobile-chat-dock-actions--reduced' : 'mobile-chat-dock-actions'}`}>
              {layout.middleSecondaries.map((action, index) => {
                const Icon = dockIconFor(action.icon);
                return (
                  <DockTooltipButton key={action.id} tooltip={action.label} aria-label={action.label} style={reduced ? undefined : { animationDelay: `${index * 30}ms` }} onClick={() => onSecondary(action.id, index)} className="mobile-chat-dock-btn relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#A0A0A0] active:scale-[0.92] active:bg-white/[0.06]">
                    <Icon />
                  </DockTooltipButton>
                );
              })}
              <DockTooltipButton tooltip="Resumo" aria-label={summaryPanelOpen ? 'Fechar resumo' : 'Resumo'} aria-pressed={summaryPanelOpen ? true : undefined} onClick={() => onSecondary('summary', layout.middleSecondaries.length)} className={`mobile-chat-dock-btn relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#A0A0A0] active:scale-[0.92] active:bg-white/[0.06] ${summaryPanelOpen ? 'bg-[rgba(212,175,55,0.14)] text-[#D4AF37] shadow-[0_0_0_1px_rgba(212,175,55,0.45)]' : ''}`}>
                <SummaryIcon />
              </DockTooltipButton>
              <DockTooltipButton tooltip={primary.label} disabled={primary.disabled} onClick={() => onPrimary(primary.id)} className="mobile-chat-dock-btn mobile-chat-dock-primary ml-0.5 flex h-11 max-w-[min(40vw,160px)] shrink-0 items-center gap-1.5 rounded-full px-[14px] active:scale-[0.92] bg-[#D4AF37] text-[#111111]">
                {(() => {
                  const Icon = dockIconFor(primary.icon);
                  return (
                    <>
                      <Icon className="text-[#111111]" />
                      <span className="nm-caption truncate text-[11px] font-semibold leading-none text-[#111111]">{primary.label}</span>
                    </>
                  );
                })()}
              </DockTooltipButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (layout.screen === 'resultado') {
    return (
      <div className={rootClass} role="toolbar" aria-label="Ações">
        <div className="mobile-chat-dock-shell rounded-[28px]" style={shellStyle}>
          <div
            ref={innerRef}
            className={`${MOBILE_DOCK_BAR_CLASS} supports-[backdrop-filter]:bg-[rgba(19,19,19,0.72)] [@media(not((-webkit-backdrop-filter:none))):not((backdrop-filter:none))):bg-[#131313]`}
          >
            <DockTooltipButton
              tooltip="Voltar"
              aria-label="Voltar"
              onClick={onBack}
              className="mobile-chat-dock-btn mobile-chat-dock-btn--back relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#A0A0A0] active:scale-[0.92] active:bg-white/[0.06]"
            >
              <IconChevronLeft />
            </DockTooltipButton>
            <span className="mx-1.5 h-6 w-px shrink-0 bg-white/[0.12]" aria-hidden />
            <div
              className={`inline-flex shrink-0 items-center gap-1 ${
                reduced ? 'mobile-chat-dock-actions--reduced' : 'mobile-chat-dock-actions'
              }`}
            >
              {layout.secondaries.map((action, index) => {
                const Icon = dockIconFor(action.icon);
                return (
                  <DockTooltipButton
                    key={action.id}
                    tooltip={action.label}
                    aria-label={action.label}
                    style={reduced ? undefined : { animationDelay: `${index * 30}ms` }}
                    onClick={() => onSecondary(action.id, index)}
                    className="mobile-chat-dock-btn relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#A0A0A0] transition-[transform,background-color,color] duration-150 active:scale-[0.92] active:bg-white/[0.06]"
                  >
                    <Icon />
                  </DockTooltipButton>
                );
              })}
              <DockTooltipButton
                tooltip={layout.primary.label}
                disabled={layout.primary.disabled}
                onClick={() => onPrimary(layout.primary.id)}
                className={`mobile-chat-dock-btn mobile-chat-dock-primary ml-0.5 flex h-11 max-w-[min(52vw,200px)] shrink-0 items-center gap-1.5 rounded-full px-[14px] active:scale-[0.92] ${
                  layout.primary.disabled
                    ? 'border border-[rgba(212,175,55,0.3)] bg-transparent text-[rgba(212,175,55,0.5)]'
                    : 'bg-[#D4AF37] text-[#111111]'
                }`}
              >
                {(() => {
                  const Icon = dockIconFor(layout.primary.icon);
                  return (
                    <>
                      <Icon className={layout.primary.disabled ? 'opacity-50' : ''} />
                      <span className="nm-caption truncate text-[11px] font-semibold leading-none text-[#111111]">
                        {layout.primary.label}
                      </span>
                    </>
                  );
                })()}
              </DockTooltipButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const summarySpec = { id: 'summary' as const, label: 'Resumo', icon: 'panel-right' as const };
  const isSummaryActive = summaryPanelOpen;
  const pdfTooltip = pdfModel?.isFree ? 'Desbloquear análise' : 'Baixar PDF';

  return (
    <div className={rootClass} role="toolbar" aria-label="Ações">
      <div className="mobile-chat-dock-shell rounded-[28px]" style={shellStyle}>
        <div
          ref={innerRef}
          className={`${MOBILE_DOCK_BAR_CLASS} supports-[backdrop-filter]:bg-[rgba(19,19,19,0.72)] [@media(not((-webkit-backdrop-filter:none))):not((backdrop-filter:none))):bg-[#131313]`}
        >
          <DockTooltipButton
            tooltip="Voltar"
            aria-label="Voltar"
            onClick={onBack}
            className="mobile-chat-dock-btn mobile-chat-dock-btn--back relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#A0A0A0] active:scale-[0.92] active:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-[3px]"
          >
            <IconChevronLeft />
          </DockTooltipButton>

          <span className="mx-1.5 h-6 w-px shrink-0 bg-white/[0.12]" aria-hidden />

          <div
            className={`inline-flex shrink-0 items-center gap-1 ${
              reduced ? 'mobile-chat-dock-actions--reduced' : 'mobile-chat-dock-actions'
            }`}
          >
            {layout.middleSecondaries.map((action, index) => {
              const Icon = dockIconFor(action.icon);
              return (
                <DockTooltipButton
                  key={action.id}
                  tooltip={action.label}
                  aria-label={action.label}
                  style={reduced ? undefined : { animationDelay: `${index * 30}ms` }}
                  onClick={() => onSecondary(action.id, index)}
                  className={dockSecondaryBtnClass(
                    action.id,
                    'mobile-chat-dock-btn relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#A0A0A0] transition-[transform,background-color,color] duration-150 active:scale-[0.92] active:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-[3px]'
                  )}
                >
                  <Icon />
                </DockTooltipButton>
              );
            })}

            <DockTooltipButton
              tooltip="Resumo"
              aria-label={isSummaryActive ? 'Fechar resumo' : summarySpec.label}
              aria-pressed={isSummaryActive ? true : undefined}
              onClick={() => onSecondary('summary', layout.middleSecondaries.length)}
              className={`mobile-chat-dock-btn relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#A0A0A0] transition-[transform,background-color,color,box-shadow] duration-150 active:scale-[0.92] active:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-[3px] ${
                isSummaryActive
                  ? 'bg-[rgba(212,175,55,0.14)] text-[#D4AF37] shadow-[0_0_0_1px_rgba(212,175,55,0.45)]'
                  : ''
              }`}
            >
              <span className="relative flex h-[22px] w-[22px] items-center justify-center">
                <SummaryIcon />
                {summaryBadge && !summaryPanelOpen && (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#D4AF37]"
                    aria-hidden
                  />
                )}
              </span>
            </DockTooltipButton>

            {pdfModel && (pdfModel.visible || pdfExiting) && onPdfClick && (
              <ChatPdfDockCircle
                model={pdfModel}
                onClick={onPdfClick}
                exiting={pdfExiting}
                tooltip={pdfTooltip}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileChatDock;
