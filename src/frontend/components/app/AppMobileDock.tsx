import React, { useMemo } from 'react';
import {
  buildAppNavDockItems,
  showAppNavRouteLoadingBar,
  type AppNavDockItem,
} from './app-mobile-nav.js';
import { iconForNavItem } from './AppNavDockIcons.js';
import { MobileChatDock } from './chat/MobileChatDock.js';
import {
  dockShellWidthStyle,
  MOBILE_DOCK_BAR_CLASS,
  MOBILE_DOCK_ROOT_CLASS,
} from './chat/mobile-dock-layout.js';
import { useDockBarWidth } from './chat/useDockBarWidth.js';
import { DockTooltipButton } from './chat/DockTooltipButton.js';
import { resolveMobileDockContext } from '../../lib/mobile-dock-context.js';
import { useMobileDockActionSnapshot } from '../../lib/mobile-dock-action-store.js';

export interface AppMobileDockProps {
  pathname: string;
  isAdmin: boolean;
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

  if (item.accent === 'purple') {
    return `${base} bg-[rgba(190,165,255,0.14)] text-[#bea5ff] shadow-[0_0_0_1px_rgba(190,165,255,0.45)] focus-visible:outline-[#bea5ff]`;
  }

  return `${base} bg-[rgba(212,175,55,0.14)] text-[#D4AF37] shadow-[0_0_0_1px_rgba(212,175,55,0.45)] focus-visible:outline-[#D4AF37]`;
}

function navigateFromDock(item: AppNavDockItem) {
  if (item.disabled) return;

  if (item.external) {
    window.open(item.href, '_blank', 'noopener,noreferrer');
    return;
  }

  if (item.href === window.location.pathname) return;

  showAppNavRouteLoadingBar();
  window.location.href = item.href;
}

function AppNavDockBar({
  pathname,
  isAdmin,
  showAnalisesNav,
}: AppMobileDockProps) {
  const items = useMemo(
    () => buildAppNavDockItems({ pathname, isAdmin, showAnalisesNav }),
    [pathname, isAdmin, showAnalisesNav]
  );

  const measureKey = useMemo(
    () => items.map((i) => `${i.id}${i.active ? 'a' : ''}${i.disabled ? 'd' : ''}`).join('|'),
    [items]
  );

  const { innerRef, widthPx } = useDockBarWidth(measureKey);
  const reduced = prefersReducedMotion();
  const shellStyle = dockShellWidthStyle(widthPx, reduced);

  return (
    <div
      className={`${MOBILE_DOCK_ROOT_CLASS} nm-app-mobile-dock`}
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="mobile-chat-dock-shell rounded-[28px]" style={shellStyle}>
        <div
          ref={innerRef}
          className={`${MOBILE_DOCK_BAR_CLASS} supports-[backdrop-filter]:bg-[rgba(19,19,19,0.72)] [@media(not((-webkit-backdrop-filter:none))):not((backdrop-filter:none))):bg-[#131313]`}
        >
          <div
            className={`inline-flex shrink-0 items-center gap-1 ${
              reduced ? 'mobile-chat-dock-actions--reduced' : 'mobile-chat-dock-actions'
            }`}
          >
            {items.map((item, index) => {
              const Icon = iconForNavItem(item.id);
              const tooltip = item.disabled
                ? 'Disponível após adquirir um produto'
                : item.label;

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
        </div>
      </div>
    </div>
  );
}

/** Única dock mobile do /app: mesma posição fixa; conteúdo por rota. */
export default function AppMobileDock(props: AppMobileDockProps) {
  const dockContext = resolveMobileDockContext(props.pathname);
  const actionSnapshot = useMobileDockActionSnapshot();

  if (dockContext === 'action') {
    if (!actionSnapshot?.state.layout || !actionSnapshot.handlers) {
      return null;
    }
    const { state, handlers } = actionSnapshot;
    return (
      <div className="nm-app-mobile-dock-host contents">
        <MobileChatDock
          layout={state.layout}
          summaryPanelOpen={state.summaryPanelOpen}
          restartExitActive={state.restartExitActive}
          summaryBadge={state.summaryBadge}
          pdfModel={state.pdfModel}
          pdfExiting={state.pdfExiting}
          onPdfClick={handlers.onPdfClick}
          onBack={handlers.onBack}
          onSecondary={handlers.onSecondary}
          onPrimary={handlers.onPrimary}
        />
      </div>
    );
  }

  return <AppNavDockBar {...props} />;
}
