import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);
  const [reduceMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    if (reduceMotion) return;

    let rafId = 0;

    const calculate = () => {
      rafId = 0;
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;

      if (totalScrollable <= 0) {
        setProgress(0);
        return;
      }

      // Progression between when top enters top of viewport (rect.top <= 0)
      // until bottom of wrapper reaches bottom of viewport
      const currentScroll = -rect.top;
      const rawProgress = currentScroll / totalScrollable;
      const clamped = Math.min(1, Math.max(0, rawProgress));

      setProgress(clamped);
    };

    const handleScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(calculate);
      }
    };

    calculate();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [reduceMotion]);

  return { ref, progress, reduceMotion };
}
