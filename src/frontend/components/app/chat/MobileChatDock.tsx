import React, { useEffect, useRef, useState } from 'react';
import type { MobileDockLayout } from './mobile-dock-screen.js';
import type { DockPrimaryActionId, DockSecondaryActionId } from './mobile-dock-screen.js';
import { IconChevronLeft, dockIconFor } from './MobileChatDockIcons.js';

export interface MobileChatDockProps {
  layout: MobileDockLayout | null;
  summaryPanelOpen: boolean;
  summaryBadge: boolean;
  otherOptionsDisabled?: boolean;
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
  summaryBadge,
  otherOptionsDisabled = false,
  onBack,
  onSecondary,
  onPrimary,
}: MobileChatDockProps) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
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
    if (!layout) return;
    const key = [
      layout.screen,
      ...layout.secondaries.map((s) => s.id),
      layout.primary?.id ?? '',
      layout.primary?.disabled ? 'd' : 'e',
    ].join('|');
    if (prevActionsRef.current && prevActionsRef.current !== key) {
      setActionKey(key);
    }
    prevActionsRef.current = key;
  }, [layout]);

  if (!layout) return null;

  const reduced = prefersReducedMotion();
  const hiddenByKeyboard = keyboardOpen;

  return (
    <div
      className={`md:hidden mobile-chat-dock-root fixed left-1/2 z-[70] -translate-x-1/2 max-w-[calc(100%-24px)] transition-opacity duration-[120ms] ${
        hiddenByKeyboard ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        bottom: 'calc(var(--nm-mobile-nav-h, 0px) + 12px + env(safe-area-inset-bottom, 0px))',
      }}
      role="toolbar"
      aria-label="Ações"
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

        <span className="mx-1.5 h-6 w-px shrink-0 bg-white/[0.12]" aria-hidden />

        <div
          key={actionKey || 'static'}
          className={`flex min-w-0 flex-1 items-center justify-end gap-1 ${
            reduced ? 'mobile-chat-dock-actions--reduced' : 'mobile-chat-dock-actions'
          }`}
        >
          {layout.secondaries.map((action, index) => {
            const Icon = dockIconFor(action.icon);
            const isSummary = action.id === 'summary';
            const isActive = isSummary && summaryPanelOpen;
            const disabled = action.id === 'other_options' && otherOptionsDisabled;

            return (
              <button
                key={action.id}
                type="button"
                disabled={disabled}
                aria-label={isActive ? undefined : action.label}
                aria-pressed={isActive ? true : undefined}
                style={reduced ? undefined : { animationDelay: `${index * 30}ms` }}
                onClick={() => onSecondary(action.id, index)}
                className={`mobile-chat-dock-btn relative flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full text-[#A0A0A0] transition-[transform,background-color,color] duration-150 disabled:opacity-[0.35] active:scale-[0.92] active:bg-white/[0.06] ${
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
                {isActive && (
                  <span className="nm-caption mt-0.5 text-[11px] font-normal leading-none text-[#D4AF37]">
                    {action.label}
                  </span>
                )}
              </button>
            );
          })}

          {layout.primary && (
            <button
              type="button"
              disabled={layout.primary.disabled}
              onClick={() => onPrimary(layout.primary!.id)}
              style={
                reduced
                  ? undefined
                  : { animationDelay: `${layout.secondaries.length * 30}ms` }
              }
              className={`mobile-chat-dock-btn mobile-chat-dock-primary ml-0.5 flex h-11 max-w-[min(52vw,200px)] shrink-0 items-center gap-1.5 rounded-full px-[14px] active:scale-[0.92] ${
                layout.primary.disabled
                  ? 'border border-[rgba(212,175,55,0.3)] bg-transparent text-[rgba(212,175,55,0.5)]'
                  : 'bg-[#D4AF37] text-[#111111]'
              }`}
            >
              {(() => {
                const Icon = dockIconFor(layout.primary!.icon);
                const label =
                  layout.primary!.disabled && layout.primary!.disabledLabel
                    ? layout.primary!.disabledLabel
                    : layout.primary!.label;
                return (
                  <>
                    <Icon className={layout.primary!.disabled ? 'opacity-50' : ''} />
                    <span
                      className={`nm-caption truncate text-[11px] font-semibold leading-none ${
                        layout.primary!.disabled ? 'text-[rgba(212,175,55,0.5)]' : 'text-[#111111]'
                      }`}
                    >
                      {label}
                    </span>
                  </>
                );
              })()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MobileChatDock;
