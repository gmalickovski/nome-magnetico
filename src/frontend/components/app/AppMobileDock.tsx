import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  buildAppNavDockItems,
  showAppNavRouteLoadingBar,
  type AppNavDockItem,
} from './app-mobile-nav.js';
import { iconForNavItem } from './AppNavDockIcons.js';
import { MobileChatDock } from './chat/MobileChatDock.js';
import { MobileDockRoot } from './chat/MobileDockRoot.js';
import { dockShellWidthStyle, MOBILE_DOCK_BAR_CLASS } from './chat/mobile-dock-layout.js';
import { useDockBarWidth } from './chat/useDockBarWidth.js';
import { DockTooltipButton } from './chat/DockTooltipButton.js';
import { MobileSummaryToggle } from './chat/MobileSummaryToggle.js';
import { resolveMobileDockContext } from '../../lib/mobile-dock-context.js';
import { useMobileDockActionSnapshot } from '../../lib/mobile-dock-action-store.js';
import { dockLayoutHasVisibleActions } from './chat/mobile-dock-screen.js';

export interface AppMobileDockProps {
  pathname: string;
  /** Mantido por compatibilidade com AppLayout; não afeta itens da dock. */
  isAdmin?: boolean;
  showAnalisesNav: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function activeBtnClass(item: AppNavDockItem): string {
  const base =
    'mobile-chat-dock-btn relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#A0A0A0] transition-[transform,background-color,color,box-shadow] duration-150 active:scale-[0.92] active:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px]';

  if (item.disabled) {
    return `${base} cursor-not-allowed opacity-45`;
  }

  if (!item.active) return base;

  return `${base} bg-[rgba(212,175,55,0.14)] text-[#f2ca50] shadow-[0_0_0_1px_rgba(242,202,80,0.45)] focus-visible:outline-[#f2ca50]`;
}

function navigateFromDock(item: AppNavDockItem) {
  if (item.disabled) return;
  if (item.href === window.location.pathname) return;
  showAppNavRouteLoadingBar();
  window.location.href = item.href;
}

function assertSingleMobileDockRoot(): void {
  if (import.meta.env.PROD) return;
  const roots = document.querySelectorAll('[data-nm-mobile-dock="single"]');
  if (roots.length > 1) {
    console.error(
      `[Nome Magnético] Esperada 1 dock mobile; encontradas ${roots.length}. Verifique AppMobileDock.`
    );
  }
}

/** Navegação global permanece na dock; ações contextuais expandem a mesma barra (DEV-273 + nav DEV-286). */
export default function AppMobileDock(props: AppMobileDockProps) {
  const items = useMemo(
    () => buildAppNavDockItems({ pathname: props.pathname, showAnalisesNav: props.showAnalisesNav }),
    [props.pathname, props.showAnalisesNav]
  );
  const snapshot = useMobileDockActionSnapshot();
  const context = resolveMobileDockContext(props.pathname);
  const action = context === 'action' && snapshot?.handlers ? snapshot : null;
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const reduced = prefersReducedMotion();
  const navMeasureKey = items.map((i) => `${i.id}${i.active ? 'a' : ''}${i.disabled ? 'd' : ''}`).join('|');
  const measureKey =
    navMeasureKey +
    JSON.stringify(action?.state.layout ?? null) +
    (action?.state.pdfModel?.visible ? '|pdf' : '') +
    (action?.state.pdfExiting ? '|pdf-exit' : '');
  const { innerRef, widthPx } = useDockBarWidth(measureKey);
  const barClassName = `${MOBILE_DOCK_BAR_CLASS} supports-[backdrop-filter]:bg-[rgba(19,19,19,0.72)] [@media(not((-webkit-backdrop-filter:none))):not((backdrop-filter:none))):bg-[#131313]`;

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => setKeyboardOpen(window.innerHeight - viewport.height > 100);
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  useLayoutEffect(() => {
    assertSingleMobileDockRoot();
  });

  const creationRoute = props.pathname.replace(/\/+$/, '') === '/app/analise/nome-social';
  const contextLayout = action?.state.layout ?? null;
  const showContextActions =
    contextLayout &&
    dockLayoutHasVisibleActions(contextLayout, {
      pdfVisible: Boolean(action?.state.pdfModel?.visible),
      pdfExiting: Boolean(action?.state.pdfExiting),
    });

  return (
    <>
      <MobileDockRoot
        role="navigation"
        aria-label="Navegação principal"
        className={keyboardOpen ? 'invisible pointer-events-none' : ''}
      >
        <div
          className="mobile-chat-dock-shell max-w-[calc(100vw-24px)] rounded-[28px]"
          style={dockShellWidthStyle(widthPx, reduced)}
        >
          <div ref={innerRef} className={barClassName}>
            <div
              className={`inline-flex shrink-0 items-center gap-0.5 ${
                reduced ? 'mobile-chat-dock-actions--reduced' : 'mobile-chat-dock-actions'
              }`}
              role="group"
              aria-label="Páginas da área do usuário"
            >
              {items.map((item, index) => {
                const Icon = iconForNavItem(item.id);
                const tooltip = item.disabled ? 'Disponível após adquirir um produto' : item.label;
                return (
                  <DockTooltipButton
                    key={item.id}
                    tooltip={tooltip}
                    aria-label={item.label}
                    aria-current={item.active ? 'page' : undefined}
                    disabled={item.disabled}
                    style={reduced ? undefined : { animationDelay: `${index * 30}ms` }}
                    onClick={() => navigateFromDock(item)}
                    className={activeBtnClass(item)}
                  >
                    <Icon />
                  </DockTooltipButton>
                );
              })}
            </div>
            {showContextActions && action && (
              <>
                <span
                  data-nm-dock-divider
                  className="mx-0.5 h-6 w-px shrink-0 bg-white/15"
                  aria-hidden="true"
                />
                <div
                  className="nm-mobile-dock-context min-w-11 overflow-x-auto overscroll-x-contain"
                  role="toolbar"
                  aria-label="Ações desta página"
                  tabIndex={0}
                >
                  <MobileChatDock
                    omitRoot
                    layout={contextLayout}
                    summaryPanelOpen={action.state.summaryPanelOpen}
                    restartExitActive={action.state.restartExitActive}
                    summaryBadge={action.state.summaryBadge}
                    pdfModel={action.state.pdfModel}
                    pdfExiting={action.state.pdfExiting}
                    onPdfClick={action.handlers.onPdfClick}
                    onSecondary={action.handlers.onSecondary}
                    onPrimary={action.handlers.onPrimary}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </MobileDockRoot>
      {creationRoute && action && !keyboardOpen && (
        <MobileSummaryToggle
          open={action.state.summaryPanelOpen}
          badge={action.state.summaryBadge}
          onToggle={() => action.handlers!.onSecondary('summary', 0)}
        />
      )}
    </>
  );
}
