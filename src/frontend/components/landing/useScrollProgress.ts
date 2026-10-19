import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);
  const [approach, setApproach] = useState(0);
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

      // Desconta exatamente a altura do header fixo
      const headerEl = typeof document !== 'undefined' ? document.querySelector('header') : null;
      const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 76;

      // Obtém o padding-top do container sticky para saber a posição natural do topo do título
      const stickyContainer = el.querySelector('[data-sticky-container]') as HTMLElement | null;
      const containerPaddingTop = stickyContainer
        ? parseFloat(window.getComputedStyle(stickyContainer).paddingTop) || 80
        : 80;

      // Posição natural do topo do título na viewport (antes de qualquer transform de saída)
      const titleNaturalTop = rect.top + containerPaddingTop;
      const distanceToHeader = titleNaturalTop - headerHeight;

      // O texto começa a sumir a partir do momento em que atinge o centro da área útil
      // e desaparece gradativamente de forma fluida conforme chega próximo ao header
      const usefulHeight = window.innerHeight - headerHeight;
      const usefulCenter = usefulHeight / 2; // distância do header ao centro da área útil

      // Quando distanceToHeader >= usefulCenter: título no centro (approach = 0, 100% visível)
      // Conforme distanceToHeader diminui até a base do header: approach vai suavemente de 0 a 1
      const FADE_START_DISTANCE = Math.max(160, usefulCenter);
      const FADE_END_DISTANCE = 10; // quase encostando na base do header
      const fadeRange = FADE_START_DISTANCE - FADE_END_DISTANCE;

      const rawApproach = (FADE_START_DISTANCE - distanceToHeader) / fadeRange;
      const clampedApproach = Math.min(1, Math.max(0, rawApproach));
      setApproach(clampedApproach);

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

  return { ref, progress, approach, reduceMotion };
}
