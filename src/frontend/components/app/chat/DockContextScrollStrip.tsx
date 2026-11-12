import React, { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { capturePostHogEvent } from '../../../lib/analytics.js';

const DOCK_SCROLL_SESSION_KEY = 'nm_dock_scroll';
const DOCK_SCROLL_NUDGE_KEY = 'nm_dock_scroll_nudge';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

export interface DockContextScrollStripHandle {
  isItemFullyVisible: (itemKey: string) => boolean;
  maxItemIndexSeen: () => number;
}

export interface DockContextScrollStripProps {
  children: React.ReactNode;
  surface: 'app' | 'resultado';
  /** Rola o item ativo para a vista ao abrir (ex. leitura com painel aberto). */
  activeItemSelector?: string | null;
}

export const DockContextScrollStrip = forwardRef<DockContextScrollStripHandle, DockContextScrollStripProps>(
  function DockContextScrollStrip({ children, surface, activeItemSelector }, ref) {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const startSentinelRef = useRef<HTMLDivElement>(null);
    const endSentinelRef = useRef<HTMLDivElement>(null);
    const scrollFiredRef = useRef(
      typeof sessionStorage !== 'undefined' && sessionStorage.getItem(DOCK_SCROLL_SESSION_KEY) === '1'
    );
    const maxItemIndexRef = useRef(0);
    const [fadeStart, setFadeStart] = useState(false);
    const [fadeEnd, setFadeEnd] = useState(false);
    const reduced = prefersReducedMotion();

    const itemButtons = useCallback((): HTMLElement[] => {
      const root = scrollerRef.current;
      if (!root) return [];
      return Array.from(root.querySelectorAll<HTMLElement>('[data-dock-scroll-item]'));
    }, []);

    const syncMaxItemIndex = useCallback(() => {
      const root = scrollerRef.current;
      const buttons = itemButtons();
      if (!root || buttons.length === 0) return;
      const rightEdge = root.scrollLeft + root.clientWidth;
      let maxIdx = 0;
      buttons.forEach((btn, idx) => {
        const left = btn.offsetLeft;
        const right = left + btn.offsetWidth;
        if (left < rightEdge + 1) maxIdx = Math.max(maxIdx, idx);
      });
      maxItemIndexRef.current = Math.max(maxItemIndexRef.current, maxIdx);
    }, [itemButtons]);

    const syncFadeFromScroll = useCallback(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 2) {
        setFadeStart(false);
        setFadeEnd(false);
        return;
      }
      setFadeStart(el.scrollLeft > 2);
      setFadeEnd(el.scrollLeft < max - 2);
      syncMaxItemIndex();
    }, [syncMaxItemIndex]);

    const isItemFullyVisible = useCallback(
      (itemKey: string): boolean => {
        const root = scrollerRef.current;
        if (!root) return true;
        const btn = root.querySelector<HTMLElement>(`[data-dock-scroll-item="${itemKey}"]`);
        if (!btn) return true;
        const left = btn.offsetLeft;
        const right = left + btn.offsetWidth;
        return left >= root.scrollLeft - 1 && right <= root.scrollLeft + root.clientWidth + 1;
      },
      []
    );

    useImperativeHandle(
      ref,
      () => ({
        isItemFullyVisible,
        maxItemIndexSeen: () => maxItemIndexRef.current,
      }),
      [isItemFullyVisible]
    );

    const fireDockScrollOnce = useCallback(() => {
      if (scrollFiredRef.current) return;
      scrollFiredRef.current = true;
      try {
        sessionStorage.setItem(DOCK_SCROLL_SESSION_KEY, '1');
      } catch {
        /* ignore */
      }
      capturePostHogEvent('dock_scroll', {
        max_item_index_seen: maxItemIndexRef.current,
        surface,
      });
    }, [surface]);

    const onScroll = useCallback(() => {
      syncFadeFromScroll();
      fireDockScrollOnce();
    }, [syncFadeFromScroll, fireDockScrollOnce]);

    useEffect(() => {
      const root = scrollerRef.current;
      if (!root) return;

      syncFadeFromScroll();
      root.addEventListener('scroll', onScroll, { passive: true });

      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.target === startSentinelRef.current) {
              setFadeStart(!entry.isIntersecting);
            }
            if (entry.target === endSentinelRef.current) {
              setFadeEnd(!entry.isIntersecting);
            }
          }
        },
        { root, threshold: 0.99 }
      );
      if (startSentinelRef.current) io.observe(startSentinelRef.current);
      if (endSentinelRef.current) io.observe(endSentinelRef.current);

      const onFocusIn = (e: FocusEvent) => {
        const target = e.target;
        if (!(target instanceof HTMLElement) || !root.contains(target)) return;
        target.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: scrollBehavior() });
      };
      root.addEventListener('focusin', onFocusIn);

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        const buttons = itemButtons();
        const active = document.activeElement;
        const idx = buttons.findIndex((b) => b === active);
        if (idx < 0 && buttons.length > 0) {
          buttons[0].focus();
          e.preventDefault();
          return;
        }
        const next = e.key === 'ArrowRight' ? idx + 1 : idx - 1;
        if (next >= 0 && next < buttons.length) {
          buttons[next].focus();
          e.preventDefault();
        }
      };
      root.addEventListener('keydown', onKeyDown);

      const ro = new ResizeObserver(() => syncFadeFromScroll());
      ro.observe(root);

      return () => {
        root.removeEventListener('scroll', onScroll);
        root.removeEventListener('focusin', onFocusIn);
        root.removeEventListener('keydown', onKeyDown);
        io.disconnect();
        ro.disconnect();
      };
    }, [onScroll, syncFadeFromScroll, itemButtons]);

    useEffect(() => {
      if (reduced) return;
      if (typeof localStorage !== 'undefined' && localStorage.getItem(DOCK_SCROLL_NUDGE_KEY)) return;
      const root = scrollerRef.current;
      if (!root || root.scrollWidth <= root.clientWidth + 2) return;
      const run = () => {
        root.scrollTo({ left: 12, behavior: 'auto' });
        window.setTimeout(() => {
          root.scrollTo({ left: 0, behavior: scrollBehavior() });
        }, 400);
        try {
          localStorage.setItem(DOCK_SCROLL_NUDGE_KEY, '1');
        } catch {
          /* ignore */
        }
      };
      const t = window.setTimeout(run, 600);
      return () => window.clearTimeout(t);
    }, [reduced, children]);

    useEffect(() => {
      if (!activeItemSelector) return;
      const root = scrollerRef.current;
      if (!root) return;
      const el = root.querySelector(activeItemSelector);
      if (!(el instanceof HTMLElement)) return;
      el.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: scrollBehavior() });
    }, [activeItemSelector, children]);

    return (
      <div
        className={`nm-dock-scroll-outer relative min-w-0 max-w-[var(--nm-dock-context-scroll-max)] shrink ${
          fadeStart ? 'nm-dock-scroll-outer--fade-start' : ''
        } ${fadeEnd ? 'nm-dock-scroll-outer--fade-end' : ''}`}
      >
        <div
          ref={scrollerRef}
          className="nm-dock-context-scroll flex min-h-11 min-w-0 items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain"
          role="presentation"
        >
          <div ref={startSentinelRef} className="nm-dock-scroll-sentinel w-px shrink-0" aria-hidden="true" />
          {children}
          <div ref={endSentinelRef} className="nm-dock-scroll-sentinel w-px shrink-0 pr-5" aria-hidden="true" />
        </div>
      </div>
    );
  }
);

export default DockContextScrollStrip;
