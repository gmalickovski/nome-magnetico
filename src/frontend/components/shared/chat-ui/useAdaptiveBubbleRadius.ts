import { useEffect, useRef, useState } from 'react';

/** Pill (rounded-full) quando o conteúdo medido cabe em uma linha; senão rounded-2xl. */
export function useAdaptiveBubbleRadius(contentVersion: unknown) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [singleLine, setSingleLine] = useState(false);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const measure = () => {
      const style = window.getComputedStyle(el);
      const parsed = parseFloat(style.lineHeight);
      const lineHeight = Number.isFinite(parsed) && parsed > 0 ? parsed : 22;
      setSingleLine(el.scrollHeight <= lineHeight + 2);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [contentVersion]);

  return {
    measureRef,
    radiusClass: singleLine ? 'rounded-full' : 'rounded-2xl',
  };
}
