import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** One-time opacity fade when section enters viewport. No translate or stagger. */
export function useLandingSectionReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [reduceMotion] = useState(prefersReducedMotion);
  const [revealed, setRevealed] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (reduceMotion) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, reduceMotion]);

  if (reduceMotion) {
    return {
      ref,
      className: '',
      revealed: true,
      reduceMotion: true,
    };
  }

  const opacityClass = revealed ? 'opacity-100' : 'opacity-0';

  return {
    ref,
    className: `transition-opacity duration-700 ease-out ${opacityClass}`,
    revealed,
    reduceMotion: false,
  };
}
