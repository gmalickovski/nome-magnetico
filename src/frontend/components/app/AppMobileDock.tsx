import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { buildAppNavDockItems, showAppNavRouteLoadingBar, type AppNavDockItem } from './app-mobile-nav.js';
import { iconForNavItem } from './AppNavDockIcons.js';
import { MobileChatDock } from './chat/MobileChatDock.js';
import { MobileDockRoot } from './chat/MobileDockRoot.js';
import { dockShellWidthStyle, MOBILE_DOCK_BAR_CLASS } from './chat/mobile-dock-layout.js';
import { useDockBarWidth } from './chat/useDockBarWidth.js';
import { DockTooltipButton } from './chat/DockTooltipButton.js';
import { MobileSummaryToggle } from './chat/MobileSummaryToggle.js';
import { resolveMobileDockContext } from '../../lib/mobile-dock-context.js';
import { useMobileDockActionSnapshot } from '../../lib/mobile-dock-action-store.js';

export interface AppMobileDockProps { pathname: string; isAdmin: boolean; showAnalisesNav: boolean; }
function activeBtnClass(item: AppNavDockItem): string {
  const base = 'mobile-chat-dock-btn relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#A0A0A0] transition-[transform,background-color,color,box-shadow] duration-150 active:scale-[0.92] active:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#D4AF37]';
  if (item.disabled) return base + ' cursor-not-allowed opacity-45';
  if (!item.active) return base;
  return base + (item.accent === 'purple' ? ' bg-[rgba(190,165,255,0.14)] text-[#bea5ff]' : ' bg-[rgba(212,175,55,0.14)] text-[#D4AF37]');
}
function navigateFromDock(item: AppNavDockItem) {
  if (item.disabled) return;
  if (item.external) { window.open(item.href, '_blank', 'noopener,noreferrer'); return; }
  if (item.href === window.location.pathname) return;
  showAppNavRouteLoadingBar();
  window.location.href = item.href;
}

/** A navegação permanece montada; ações contextuais ampliam a mesma barra. */
export default function AppMobileDock(props: AppMobileDockProps) {
  const items = useMemo(() => buildAppNavDockItems(props), [props.pathname, props.isAdmin, props.showAnalisesNav]);
  const snapshot = useMobileDockActionSnapshot();
  const context = resolveMobileDockContext(props.pathname);
  const action = context === 'action' && snapshot?.handlers ? snapshot : null;
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const measureKey = items.map(i => i.id).join('|') + JSON.stringify(action?.state.layout ?? null) + (action?.state.pdfModel?.visible ? '|pdf' : '') + (action?.state.pdfExiting ? '|pdf-exit' : '');
  const { innerRef, widthPx } = useDockBarWidth(measureKey);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => setKeyboardOpen(window.innerHeight - viewport.height > 100);
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => { viewport.removeEventListener('resize', update); viewport.removeEventListener('scroll', update); };
  }, []);
  useLayoutEffect(() => {
    if (!import.meta.env.PROD && document.querySelectorAll('[data-nm-mobile-dock="single"]').length > 1) {
      console.error('[Nome Magnético] Esperada uma única dock mobile.');
    }
  });
  const creationRoute = props.pathname.replace(/\/+$/, '') === '/app/analise/nome-social';
  return (
    <>
      <MobileDockRoot role="navigation" aria-label="Navegação principal" className={keyboardOpen ? 'invisible pointer-events-none' : ''}>
        <div className="mobile-chat-dock-shell max-w-[calc(100vw-24px)] rounded-[28px]" style={dockShellWidthStyle(widthPx, reduced)}>
          <div ref={innerRef} className={MOBILE_DOCK_BAR_CLASS}>
            <div className="inline-flex shrink-0 items-center gap-0.5" role="group" aria-label="Páginas da área do usuário">
              {items.map(item => {
                const Icon = iconForNavItem(item.id);
                return <DockTooltipButton key={item.id} tooltip={item.disabled ? 'Disponível após adquirir um produto' : item.label} aria-label={item.label} aria-current={item.active ? 'page' : undefined} disabled={item.disabled} onClick={() => navigateFromDock(item)} className={activeBtnClass(item)}><Icon /></DockTooltipButton>;
              })}
            </div>
            {action?.state.layout && (
              <>
                <span data-nm-dock-divider className="mx-0.5 h-6 w-px shrink-0 bg-white/15" aria-hidden="true" />
                <div className="nm-mobile-dock-context min-w-11 overflow-x-auto overscroll-x-contain" role="toolbar" aria-label="Ações desta página" tabIndex={0}>
                  <MobileChatDock omitRoot layout={action.state.layout} summaryPanelOpen={action.state.summaryPanelOpen} restartExitActive={action.state.restartExitActive} summaryBadge={action.state.summaryBadge} pdfModel={action.state.pdfModel} pdfExiting={action.state.pdfExiting} onPdfClick={action.handlers!.onPdfClick} onBack={action.handlers!.onBack} onSecondary={action.handlers!.onSecondary} onPrimary={action.handlers!.onPrimary} />
                </div>
              </>
            )}
          </div>
        </div>
      </MobileDockRoot>
      {creationRoute && action && !keyboardOpen && (
        <MobileSummaryToggle open={action.state.summaryPanelOpen} badge={action.state.summaryBadge} onToggle={() => action.handlers!.onSecondary('summary', 0)} />
      )}
    </>
  );
}
