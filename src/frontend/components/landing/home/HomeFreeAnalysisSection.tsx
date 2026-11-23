import {
  LandingSectionIntro,
  landingSectionShellClass,
  landingSectionSpacingClass,
} from '../LandingSectionIntro.js';
import { ScoreCounterScene } from '../mockups/ScoreCounterScene.js';
import { PublicAnalysisForm } from '../PublicAnalysisForm.js';
import { getRevealItemProps, useLandingSectionReveal } from '../useLandingSectionReveal.js';
import { HOME_COPY } from './home-copy.js';

/**
 * Seção 7 da Home (`DEV-338`): Formulário atual de Análise Gratuita + ScoreCounterScene ao lado.
 */
export function HomeFreeAnalysisSection() {
  const reveal = useLandingSectionReveal({ startRevealed: false });
  const copy = HOME_COPY.freeAnalysis;
  const leftReveal = getRevealItemProps(reveal.revealed, 100, reveal.reduceMotion);
  const rightReveal = getRevealItemProps(reveal.revealed, 180, reveal.reduceMotion);

  return (
    <section
      id="analise-gratuita"
      ref={reveal.ref}
      aria-label={copy.eyebrow}
      className={`relative bg-[#111111] overflow-x-clip scroll-mt-20 ${landingSectionSpacingClass}`}
    >
      {/* Âncora legada `#teste` mantida para links existentes */}
      <span id="teste" className="sr-only" aria-hidden="true" />

      <div className={landingSectionShellClass}>
        <LandingSectionIntro
          label={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          align="center"
          className="mb-10 sm:mb-14"
          revealed={reveal.revealed}
          reduceMotion={reveal.reduceMotion}
        />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center w-full min-w-0">
          <div
            className={`lg:col-span-7 min-w-0 ${leftReveal.className}`}
            style={leftReveal.style}
          >
            <PublicAnalysisForm />
          </div>

          <aside
            className={`lg:col-span-5 min-w-0 flex flex-col items-center lg:items-start text-center lg:text-left gap-4 ${rightReveal.className}`}
            style={rightReveal.style}
          >
            <div>
              <p className="nm-eyebrow mb-2">{copy.sideEyebrow}</p>
              <h3 className="nm-h3 text-[#e5e2e1] mb-2">{copy.sideTitle}</h3>
              <p className="nm-body max-w-[44ch] mx-auto lg:mx-0">{copy.sideDescription}</p>
            </div>

            <div className="w-full max-w-[310px] mx-auto lg:mx-0">
              <ScoreCounterScene device="phone" theme="social" />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default HomeFreeAnalysisSection;
