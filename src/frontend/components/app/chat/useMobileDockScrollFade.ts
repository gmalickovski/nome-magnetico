import { type RefObject, useEffect, useRef } from 'react';

const SCROLL_END_MS = 300;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Deixa o shell da dock translúcido enquanto há scroll na página ou em painéis. */
export function useMobileDockScrollFade(
  dockRootRef: RefObject<HTMLElement | null>,
  enabled = true
): void {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const root = dockRootRef.current;
    if (!enabled || !root) return;

    const reduced = prefersReducedMotion();

    const setScrolling = (on: boolean) => {
      root.classList.toggle('nm-mobile-dock--scrolling', on);
    };

    const armScrollEnd = () => {
      if (reduced) return;
      setScrolling(true);
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setScrolling(false), SCROLL_END_MS);
    };

    const onScroll = () => armScrollEnd();
    const onDockInteract = () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      setScrolling(false);
    };

    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    root.addEventListener('pointerdown', onDockInteract);

    const panes = document.querySelectorAll('.chat-scroll-pane, .nm-reading-sheet');
    panes.forEach((el) => el.addEventListener('scroll', onScroll, { passive: true }));

    const observer = new MutationObserver(() => {
      document.querySelectorAll('.nm-reading-sheet .chat-scroll-pane').forEach((el) => {
        el.removeEventListener('scroll', onScroll);
        el.addEventListener('scroll', onScroll, { passive: true });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('scroll', onScroll, true);
      root.removeEventListener('pointerdown', onDockInteract);
      panes.forEach((el) => el.removeEventListener('scroll', onScroll));
      observer.disconnect();
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      setScrolling(false);
    };
  }, [dockRootRef, enabled]);
}
