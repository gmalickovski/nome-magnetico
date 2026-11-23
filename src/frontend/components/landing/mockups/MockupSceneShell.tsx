import type { ReactNode } from 'react';
import { DeviceFrame } from './DeviceFrame.js';
import type { MockupDevice, MockupTheme } from './types.js';
import type { UseMockupTimelineResult } from './useMockupTimeline.js';

export interface MockupSceneShellProps<TAction = string> {
  sceneName: string;
  theme: MockupTheme;
  device: MockupDevice;
  timeline: UseMockupTimelineResult<TAction>;
  phoneContent: ReactNode;
  desktopContent: ReactNode;
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
  srSummary,
  statusLabel,
  reducedMotionLabel = 'Reduced motion · estado final',
  showStatusPill = false,
  className = '',
}: MockupSceneShellProps<TAction>) {
  return (
    <div
      ref={timeline.containerRef}
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

      <DeviceFrame
        variant={device}
        theme={theme}
        phoneContent={phoneContent}
        desktopContent={desktopContent}
        srSummary={srSummary}
      />
    </div>
  );
}
