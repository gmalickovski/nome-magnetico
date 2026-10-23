import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True when any part of the element is in (or near) the viewport. */
function isInOrNearViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || 0;
  // 80px lead so text starts revealing smoothly as the section enters the fold.
  return rect.top < vh - 40 && rect.bottom > 0;
}

/**
 * Standardized landing section reveal hook (DEV-196.3).
 * Uses a meditative 700ms cubic-bezier(0.22, 1, 0.36, 1) curve for smooth
 * text and card stagger entrances while respecting prefers-reduced-motion.
 */
export function useLandingSectionReveal(_threshold = 0.05) {
  const ref = useRef<HTMLElement>(null);
  const [reduceMotion] = useState(prefersReducedMotion);
  // Inicia sempre como true no SSR e hidratação para evitar qualquer flash preto ou seção vazia
  const [revealed, setRevealed] = useState(true);

  useEffect(() => {
    if (reduceMotion) return;

    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 0;

    // Se o elemento já está visível na viewport (ex: Hero no topo), mantém revelado imediatamente
    if (rect.top < vh && rect.bottom > 0) {
      setRevealed(true);
      return;
    }

    // Se estiver fora da viewport, inicializa como false para animar na rolagem
    setRevealed(false);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [reduceMotion]);

  if (reduceMotion) {
    return {
      ref,
      className: '',
      revealed: true,
      reduceMotion: true,
    };
  }

  return {
    ref,
    className: '',
    revealed,
    reduceMotion: false,
  };
}

/**
 * Helper to generate stagger reveal classes and inline delay style for child elements
 * (overline -> heading -> description -> cards).
 */
export function getRevealItemProps(revealed: boolean, delayMs = 0, reduceMotion = false) {
  if (reduceMotion) {
    return {
      className: '',
      style: undefined,
    };
  }
  return {
    className: `transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform] motion-reduce:transition-none motion-reduce:!opacity-100 motion-reduce:!translate-y-0 ${
      revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
    }`,
    style: { transitionDelay: revealed ? `${delayMs}ms` : '0ms' } as React.CSSProperties,
  };
}

