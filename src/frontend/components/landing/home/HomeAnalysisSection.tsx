import type { ReactNode } from 'react';
import {
  LandingSectionIntro,
  landingSectionShellClass,
  landingSectionSpacingClass,
} from '../LandingSectionIntro.js';
import { ScoreCounterScene } from '../mockups/ScoreCounterScene.js';
import { StarScene } from '../mockups/StarScene.js';
import { TriangleScene } from '../mockups/TriangleScene.js';
import { getRevealItemProps, useLandingSectionReveal } from '../useLandingSectionReveal.js';
import { HOME_COPY } from './home-copy.js';

interface AnalysisBlockRowProps {
  badge: string;
  title: string;
  description: string;
  reverse?: boolean;
  children: ReactNode;
}

function AnalysisBlockRow({
  badge,
  title,
  description,
  reverse = false,
  children,
}: AnalysisBlockRowProps) {
  const reveal = useLandingSectionReveal({ startRevealed: false });
  const textReveal = getRevealItemProps(reveal.revealed, 0, reveal.reduceMotion);
  const sceneReveal = getRevealItemProps(reveal.revealed, 120, reveal.reduceMotion);

  return (
    <div
      ref={reveal.ref}
      className={`flex flex-col ${
        reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'
      } items-center gap-8 lg:gap-12 w-full min-w-0`}
    >
      <div
        className={`w-full lg:w-[32%] min-w-0 text-center lg:text-left ${textReveal.className}`}
        style={textReveal.style}
      >
        <p className="nm-eyebrow mb-2.5">{badge}</p>
        <h3 className="nm-h3 text-[#e5e2e1] mb-3">{title}</h3>
        <p className="nm-body-lg max-w-[46ch] mx-auto lg:mx-0">{description}</p>
      </div>

      <div
        className={`w-full lg:w-[68%] min-w-0 ${sceneReveal.className}`}
        style={sceneReveal.style}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Seção 4 da Home (`DEV-338`): O que o cálculo analisa (Estrela, Triângulo da Vida, Nota).
 */
export function HomeAnalysisSection() {
  const headerReveal = useLandingSectionReveal({ startRevealed: false });
  const copy = HOME_COPY.analysis;
  const [b1, b2, b3] = copy.blocks;

  return (
    <section
      id="o-que-analisa"
      ref={headerReveal.ref}
      aria-label={copy.eyebrow}
      className={`relative bg-[#131313] overflow-x-clip scroll-mt-20 ${landingSectionSpacingClass}`}
    >
      <div className={landingSectionShellClass}>
        <LandingSectionIntro
          label={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          align="center"
          className="mb-12 sm:mb-16 md:mb-20"
          revealed={headerReveal.revealed}
          reduceMotion={headerReveal.reduceMotion}
        />

        <div className="max-w-7xl mx-auto space-y-16 sm:space-y-20 lg:space-y-24">
          <AnalysisBlockRow badge={b1.badge} title={b1.title} description={b1.description}>
            <StarScene device="both" theme="social" />
          </AnalysisBlockRow>

          <AnalysisBlockRow badge={b2.badge} title={b2.title} description={b2.description} reverse>
            <TriangleScene device="both" theme="social" />
          </AnalysisBlockRow>

          <AnalysisBlockRow badge={b3.badge} title={b3.title} description={b3.description}>
            <ScoreCounterScene device="both" theme="social" />
          </AnalysisBlockRow>
        </div>
      </div>
    </section>
  );
}

export default HomeAnalysisSection;
