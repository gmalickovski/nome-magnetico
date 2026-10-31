import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

/** Mede a largura natural do conteúdo e expõe valor para animar o shell sem pulo. */
export function useDockBarWidth(depsKey: string): {
  innerRef: RefObject<HTMLDivElement | null>;
  widthPx: number | null;
} {
  const innerRef = useRef<HTMLDivElement>(null);
  const [widthPx, setWidthPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const measure = () => {
      setWidthPx(el.offsetWidth);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [depsKey]);

  return { innerRef, widthPx };
}
