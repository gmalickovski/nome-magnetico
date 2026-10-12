import { useEffect, type RefObject } from 'react';

/**
 * Desktop/widescreen only: scale `.product-mockup-fit` via CSS zoom so the full
 * mockup stack fits in the remaining viewport below the sticky header.
 * Mobile/stacked layouts are left at zoom 1 (no fit needed).
 */
export function useDesktopMockupFit(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;

    const desktopMq = window.matchMedia('(min-width: 840px)');

    let fitting = false;

    const fit = () => {
      if (fitting) return;
      fitting = true;

      try {
        if (!desktopMq.matches) {
          el.style.zoom = '';
          return;
        }

        el.style.zoom = '1';
        // Natural height at 1:1. Reserve sticky header + section padding so the
        // full stack clears the fold on ~14" laptop viewports.
        const height = el.getBoundingClientRect().height;
        const headerClearance = 72;
        const sectionPad = 56;
        const available = window.innerHeight - headerClearance - sectionPad;

        if (height > available && available > 180) {
          const next = Math.max(0.55, Math.min(1, (available * 0.97) / height));
          el.style.zoom = String(Number(next.toFixed(3)));
        }
      } finally {
        fitting = false;
      }
    };

    fit();

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => fit()) : null;
    ro?.observe(el);
    window.addEventListener('resize', fit);
    desktopMq.addEventListener('change', fit);

    // Re-fit after score/stagger animations settle.
    const t1 = window.setTimeout(fit, 200);
    const t2 = window.setTimeout(fit, 700);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', fit);
      desktopMq.removeEventListener('change', fit);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      el.style.zoom = '';
    };
  }, [ref]);
}
