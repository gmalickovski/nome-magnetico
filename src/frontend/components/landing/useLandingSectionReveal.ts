import { useEffect, useRef, useState } from 'react';

/** One-time fade when section enters viewport; disabled when prefers-reduced-motion. */
export function useLandingSectionReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const motionClass = revealed
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-2 motion-reduce:opacity-100 motion-reduce:translate-y-0';

  return {
    ref,
    className: `transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${motionClass}`,
  };
}
