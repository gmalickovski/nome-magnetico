import React, { useEffect, useMemo, useState } from 'react';
import { MobileDockRoot } from '../app/chat/MobileDockRoot';
import { MOBILE_DOCK_BAR_CLASS } from '../app/chat/mobile-dock-layout';
import { useMobileKeyboardOpen } from '../app/chat/useMobileKeyboardOpen';
import { isOpsMoreActive, isOpsNavActive, splitOpsNav } from '../../ops/nav';
import { IconMais, IconSair, OpsNavIcon } from './OpsNavIcons';
import { OpsLogoutButton } from './OpsLogoutButton';

const BTN_BASE =
  'mobile-chat-dock-btn nm-dock-nav-btn relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#A0A0A0] transition-[transform,background-color,color] duration-150 active:scale-[0.92] active:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#D4AF37]';

function btnClass(active: boolean): string {
  return active ? `${BTN_BASE} text-[#D4AF37]` : BTN_BASE;
}

function ActiveMark() {
  return (
    <span
      className="nm-dock-nav-active-mark absolute bottom-1.5 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-[#D4AF37]"
      aria-hidden="true"
    />
  );
}

/** Dock inferior do admin (DEV-309): mesma barra flutuante do /app, com 5 itens e "Mais". */
export default function OpsMobileDock({ pathname }: { pathname: string }) {
  const { primary, more } = useMemo(() => splitOpsNav(), []);
  const keyboardOpen = useMobileKeyboardOpen();
  const [open, setOpen] = useState(false);
  const moreActive = isOpsMoreActive(pathname);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {open && (
        <div className="lg:hidden fixed inset-0 z-[78]" role="presentation">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            id="ops-dock-more"
            role="dialog"
            aria-label="Mais páginas do painel"
            className="absolute inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] max-h-[60dvh] overflow-y-auto rounded-2xl bg-[#1c1c1c] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
          >
            <ul className="grid grid-cols-2 gap-2">
              {more.map((item) => {
                const active = isOpsNavActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-colors duration-300 ${
                        active
                          ? 'bg-[#D4AF37]/12 text-[#f2ca50]'
                          : 'text-[#e5e2e1]/85 hover:bg-white/[0.04] hover:text-[#f2ca50]'
                      }`}
                    >
                      <OpsNavIcon href={item.href} className="h-5 w-5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 flex items-center gap-3 rounded-2xl px-3 text-sm text-[#A0A0A0]">
              <IconSair className="h-5 w-5 shrink-0" />
              <OpsLogoutButton className="flex-1 text-left" />
            </div>
          </div>
        </div>
      )}

      <MobileDockRoot
        role="navigation"
        aria-label="Navegação do painel"
        className={keyboardOpen ? 'nm-mobile-dock--keyboard-hidden' : undefined}
      >
        <div className="mobile-chat-dock-shell max-w-[calc(100vw-24px)] rounded-[28px]">
          <div className={`${MOBILE_DOCK_BAR_CLASS} items-center`}>
            <div className="inline-flex shrink-0 items-center gap-1" role="group" aria-label="Páginas do painel">
              {primary.map((item) => {
                const active = isOpsNavActive(pathname, item.href);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    className={btnClass(active)}
                  >
                    <OpsNavIcon href={item.href} className="h-[22px] w-[22px] shrink-0" />
                    {active ? <ActiveMark /> : null}
                  </a>
                );
              })}
              <button
                type="button"
                title="Mais"
                aria-label="Mais páginas"
                aria-expanded={open}
                aria-controls="ops-dock-more"
                onClick={() => setOpen((value) => !value)}
                className={btnClass(moreActive || open)}
              >
                <IconMais className="h-[22px] w-[22px] shrink-0" />
                {moreActive ? <ActiveMark /> : null}
              </button>
            </div>
          </div>
        </div>
      </MobileDockRoot>
    </>
  );
}
