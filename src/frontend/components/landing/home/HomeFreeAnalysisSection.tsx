import {
  LandingSectionIntro,
  landingSectionShellClass,
  landingSectionSpacingClass,
} from '../LandingSectionIntro.js';
import { PublicAnalysisForm } from '../PublicAnalysisForm.js';
import { getRevealItemProps, useLandingSectionReveal } from '../useLandingSectionReveal.js';
import { HOME_COPY } from './home-copy.js';

/**
 * Seção 7 da Home (`DEV-338`): Formulário de Análise Gratuita (a prévia do PDF fica na página /analise-gratuita).
 */
export function HomeFreeAnalysisSection() {
  const reveal = useLandingSectionReveal({ startRevealed: false });
  const copy = HOME_COPY.freeAnalysis;
  const leftReveal = getRevealItemProps(reveal.revealed, 100, reveal.reduceMotion);

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

        <div
          className={`max-w-4xl mx-auto w-full min-w-0 ${leftReveal.className}`}
          style={leftReveal.style}
        >
          <PublicAnalysisForm />
        </div>
      </div>
    </section>
  );
}

export default HomeFreeAnalysisSection;
