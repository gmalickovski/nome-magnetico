import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** One-time fade + light rise when a landing section enters the viewport. */
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

  const motionClass = revealed
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-3';

  return {
    ref,
    className: `transition-[opacity,transform] duration-[600ms] ease-out motion-reduce:transition-none motion-reduce:!opacity-100 motion-reduce:!translate-y-0 ${motionClass}`,
    revealed,
    reduceMotion: false,
  };
}
