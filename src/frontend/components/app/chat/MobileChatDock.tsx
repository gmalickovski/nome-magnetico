import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildMobileDockActions,
  resolveMobileDockScreen,
  type MobileDockActionId,
  type MobileDockScreen,
} from './mobile-dock-screen.js';
import { IconChevronLeft, dockIconFor } from './MobileChatDockIcons.js';

export interface MobileChatDockProps {
  birthConfirmed: boolean;
  profileCollectionComplete: boolean;
  hasSuggestionsMessage: boolean;
  activeSuggestionId: string | null;
  canShowSummary: boolean;
  canRestart: boolean;
  canRegenerate: boolean;
  canPdf: boolean;
  canShare: boolean;
  summaryPanelOpen: boolean;
  summaryBadge: boolean;
  onBack: () => void;
  onAction: (action: MobileDockActionId, screen: MobileDockScreen) => void;
  regenerateDisabled?: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function MobileChatDock({
  birthConfirmed,
  profileCollectionComplete,
  hasSuggestionsMessage,
  activeSuggestionId,
  canShowSummary,
  canRestart,
  canRegenerate,
  canPdf,
  canShare,
  summaryPanelOpen,
  summaryBadge,
  onBack,
  onAction,
  regenerateDisabled = false,
}: MobileChatDockProps) {
  const screen = resolveMobileDockScreen({
    birthConfirmed,
    profileCollectionComplete,
    hasSuggestionsMessage,
    activeSuggestionId,
    canShowSummary,
    canRestart,
    canRegenerate,
    canPdf,
    canShare,
  });

  const actions = useMemo(() => {
    if (!screen) return [];
    return buildMobileDockActions(screen, {
      birthConfirmed,
      profileCollectionComplete,
      hasSuggestionsMessage,
      activeSuggestionId,
      canShowSummary,
      canRestart,
      canRegenerate,
      canPdf,
      canShare,
    });
  }, [
    screen,
    birthConfirmed,
    profileCollectionComplete,
    hasSuggestionsMessage,
    activeSuggestionId,
    canShowSummary,
    canRestart,
    canRegenerate,
    canPdf,
    canShare,
  ]);

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [actionKey, setActionKey] = useState('');
  const prevActionsRef = useRef<string>('');

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

  useEffect(() => {
    const key = actions.map((a) => a.id).join('|');
    if (prevActionsRef.current && prevActionsRef.current !== key) {
      setActionKey(key);
    }
    prevActionsRef.current = key;
  }, [actions]);

  useEffect(() => {
    if (!screen) {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [screen]);

  if (!screen) return null;

  const reduced = prefersReducedMotion();
  const hiddenByKeyboard = keyboardOpen;

  return (
    <div
      className={`md:hidden mobile-chat-dock-root fixed left-1/2 z-[70] -translate-x-1/2 max-w-[calc(100%-24px)] transition-opacity duration-[120ms] ${
        hiddenByKeyboard || !visible ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${summaryPanelOpen ? '' : ''}`}
      style={{
        bottom: 'calc(var(--nm-mobile-nav-h, 0px) + 12px + env(safe-area-inset-bottom, 0px))',
      }}
      role="toolbar"
      aria-label="Ações do chat"
    >
      <div
        className={`mobile-chat-dock-bar flex h-14 items-center gap-1 rounded-[28px] border border-[rgba(212,175,55,0.18)] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-[20px] backdrop-saturate-[140%] bg-[rgba(19,19,19,0.72)] supports-[backdrop-filter]:bg-[rgba(19,19,19,0.72)] [@media(not((-webkit-backdrop-filter:none))):not((backdrop-filter:none))]:bg-[#131313] ${
          reduced ? '' : 'mobile-chat-dock-bar--animate-width'
        }`}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="mobile-chat-dock-btn mobile-chat-dock-btn--back relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#A0A0A0] active:scale-[0.92] active:bg-white/[0.06]"
        >
          <IconChevronLeft />
        </button>

        <span
          className="mx-1.5 h-6 w-px shrink-0 bg-white/[0.12]"
          aria-hidden
        />

        <div
          key={actionKey || 'static'}
          className={`flex items-center gap-1 ${reduced ? 'mobile-chat-dock-actions--reduced' : 'mobile-chat-dock-actions'}`}
        >
          {actions.map((action, index) => {
            const Icon = dockIconFor(action.icon);
            const isSummary = action.id === 'summary';
            const isActive = isSummary && summaryPanelOpen;
            const disabled =
              action.id === 'regenerate' && regenerateDisabled;
            const showLabel = isActive;

            return (
              <button
                key={action.id}
                type="button"
                disabled={disabled}
                aria-label={showLabel ? undefined : action.label}
                aria-pressed={isActive ? true : undefined}
                style={reduced ? undefined : { animationDelay: `${index * 30}ms` }}
                onClick={() => onAction(action.id, screen)}
                className={`mobile-chat-dock-btn relative flex min-h-11 min-w-11 flex-col items-center justify-center rounded-full px-2 text-[#A0A0A0] transition-[transform,background-color,color] duration-150 disabled:opacity-[0.35] active:scale-[0.92] active:bg-white/[0.06] ${
                  isActive ? 'bg-[rgba(212,175,55,0.12)] text-[#D4AF37]' : ''
                }`}
              >
                <span className="relative flex h-[22px] w-[22px] items-center justify-center">
                  <Icon />
                  {isSummary && summaryBadge && !summaryPanelOpen && (
                    <span
                      className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#D4AF37]"
                      aria-hidden
                    />
                  )}
                </span>
                {showLabel && (
                  <span className="nm-caption mt-0.5 text-[11px] leading-none text-[#D4AF37]">
                    {action.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MobileChatDock;
