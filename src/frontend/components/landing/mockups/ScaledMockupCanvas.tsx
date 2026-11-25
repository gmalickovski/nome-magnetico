import React, { useEffect, useRef, useState } from 'react';

export interface ScaledMockupCanvasProps {
  /** Largura lógica alvo (ex.: 375 para celular, 1024 para desktop). */
  logicalWidth: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Renderiza os componentes reais do chat numa largura lógica fixa e os escala
 * proporcionalmente ao tamanho da moldura (`DeviceFrame`), preservando exatamente
 * a tipografia, espaçamentos e breakpoints reais sem criar clones miniaturizados.
 */
export function ScaledMockupCanvas({
  logicalWidth,
  children,
  className = '',
}: ScaledMockupCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setBox((prev) =>
          prev &&
          Math.abs(prev.width - rect.width) < 0.5 &&
          Math.abs(prev.height - rect.height) < 0.5
            ? prev
            : { width: rect.width, height: rect.height },
        );
      }
    };

    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = box ? Math.min(1, box.width / logicalWidth) : 1;
  const scaledHeight = box ? Math.round(box.height / scale) : undefined;

  return (
    <div
      ref={hostRef}
      className={`relative flex-1 w-full h-full min-h-0 overflow-hidden ${className}`}
    >
      <div
        style={
          box
            ? {
                width: `${logicalWidth}px`,
                height: `${scaledHeight}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }
            : { inset: 0 }
        }
        className="absolute left-0 top-0 flex flex-col min-h-0"
      >
        {children}
      </div>
    </div>
  );
}
