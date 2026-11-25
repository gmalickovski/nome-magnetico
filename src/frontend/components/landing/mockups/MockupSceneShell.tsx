import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DeviceFrame } from './DeviceFrame.js';
import type { MockupDevice, MockupTheme } from './types.js';
import type { UseMockupTimelineResult } from './useMockupTimeline.js';

export interface MockupSceneShellProps<TAction = string> {
  sceneName: string;
  theme: MockupTheme;
  device: MockupDevice;
  timeline: UseMockupTimelineResult<TAction>;
  phoneContent?: ReactNode;
  desktopContent?: ReactNode;
  /** Quando informado, a cena aparece solta, sem moldura de celular/desktop. */
  framelessContent?: ReactNode;
  srSummary: string;
  statusLabel: string;
  reducedMotionLabel?: string;
  showStatusPill?: boolean;
  className?: string;
}

/**
 * Wrapper padrão para cenas de mockup: conecta atributos `data-mockup-*`, pílula opcional de QA
 * e renderização responsiva em `DeviceFrame`.
 */
export function MockupSceneShell<TAction = string>({
  sceneName,
  theme,
  device,
  timeline,
  phoneContent,
  desktopContent,
  framelessContent,
  srSummary,
  statusLabel,
  reducedMotionLabel = 'Reduced motion · estado final',
  showStatusPill = false,
  className = '',
}: MockupSceneShellProps<TAction>) {
  // Altura estável: a coluna do mockup nunca encolhe durante a animação (só cresce até o maior estado),
  // então o texto ao lado não muda de posição.
  const innerRef = useRef<HTMLDivElement>(null);
  const [stableMin, setStableMin] = useState(0);
  useEffect(() => {
    const el = innerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      setStableMin((prev) => (h > prev ? h : prev));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [framelessContent]);

  return (
    <div
      ref={timeline.containerRef}
      style={framelessContent && stableMin ? { minHeight: stableMin } : undefined}
      data-mockup-scene={sceneName}
      data-mockup-theme={theme}
      data-mockup-playing={timeline.isPlaying ? 'true' : 'false'}
      data-mockup-in-view={timeline.isInView ? 'true' : 'false'}
      data-mockup-reduced-motion={timeline.reducedMotion ? 'true' : 'false'}
      className={`relative w-full min-w-0 ${className}`}
    >
      {showStatusPill ? (
        <div className="mb-2 flex flex-wrap items-center justify-end gap-2 text-[11px] font-inter text-[#a0a0a0]">
          <span className="rounded-full bg-[#1C1C1C] px-2.5 py-0.5 ring-1 ring-white/[0.08]">
            {timeline.reducedMotion
              ? reducedMotionLabel
              : timeline.isPlaying
                ? statusLabel
                : 'Pausado fora da tela'}
          </span>
        </div>
      ) : null}

      {framelessContent ? (
        <div ref={innerRef} className="w-full min-w-0 h-fit">
          <p className="sr-only">{srSummary}</p>
          <div aria-hidden="true" className="select-none pointer-events-none w-full min-w-0">
            {framelessContent}
          </div>
        </div>
      ) : (
        <DeviceFrame
          variant={device}
          theme={theme}
          phoneContent={phoneContent}
          desktopContent={desktopContent}
          srSummary={srSummary}
        />
      )}
    </div>
  );
}
