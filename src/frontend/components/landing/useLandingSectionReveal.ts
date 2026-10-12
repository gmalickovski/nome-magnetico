import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True when any part of the element is in (or near) the viewport. */
function isInOrNearViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || 0;
  // 120px lead so text starts revealing just before the section hits the fold.
  return rect.top < vh + 120 && rect.bottom > -40;
}

/**
 * One-time fade + light rise when a landing section enters the viewport.
 * Sync check on mount + permissive IO so tall product sections never sit blank
 * for seconds while the user scrolls into them.
 */
export function useLandingSectionReveal(_threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [reduceMotion] = useState(prefersReducedMotion);
  const [revealed, setRevealed] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (reduceMotion) return;

    const el = ref.current;
    if (!el) return;

    if (isInOrNearViewport(el)) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      // Expand the root upward so reveal starts as the section approaches,
      // not after a % of a tall section is already on screen.
      { threshold: 0, rootMargin: '120px 0px 0px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

  if (reduceMotion) {
    return {
      ref,
      className: '',
      revealed: true,
      reduceMotion: true,
    };
  }

  const motionClass = revealed
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-2';

  return {
    ref,
    className: `transition-[opacity,transform] duration-[350ms] ease-out motion-reduce:transition-none motion-reduce:!opacity-100 motion-reduce:!translate-y-0 ${motionClass}`,
    revealed,
    reduceMotion: false,
  };
}
