import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DockContextualAction } from './dock-contextual-actions.js';
import { IconMoreHorizontal } from './MobileChatDockIcons.js';
import { dockIconFor, IconScrollText } from './MobileChatDockIcons.js';
import { DockTooltipButton } from './DockTooltipButton.js';

const CONTEXT_BTN =
  'mobile-chat-dock-btn relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#D4AF37] transition-[transform,background-color,color] duration-150 active:scale-[0.92] active:bg-[#D4AF37]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#D4AF37]';

export function DockContextOverflow({
  items,
  onPick,
}: {
  items: DockContextualAction[];
  onPick: (item: DockContextualAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            role="menu"
            className="nm-dock-overflow-menu fixed z-[90] min-w-[11rem] rounded-2xl border border-[#D4AF37]/25 bg-[#1C1C1C] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
            style={{
              left: rootRef.current
                ? rootRef.current.getBoundingClientRect().left +
                  rootRef.current.getBoundingClientRect().width / 2
                : 0,
              bottom:
                (typeof window !== 'undefined' ? window.innerHeight : 800) -
                (rootRef.current?.getBoundingClientRect().top ?? 0) +
                8,
              transform: 'translateX(-50%)',
            }}
          >
            {items.map((item) => {
              const Icon =
                item.kind === 'reading' ? IconScrollText : item.icon ? dockIconFor(item.icon) : IconMoreHorizontal;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-[#E5E2E1] hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
                  onClick={() => {
                    setOpen(false);
                    onPick(item);
                  }}
                >
                  <Icon className="h-5 w-5 shrink-0 text-[#D4AF37]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      {menu}
      <DockTooltipButton
        tooltip="Mais ações"
        aria-label="Mais ações"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={CONTEXT_BTN}
      >
        <IconMoreHorizontal />
      </DockTooltipButton>
    </div>
  );
}
