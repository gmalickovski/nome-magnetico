import { useEffect, useState } from 'react';
import {
  LandingSectionIntro,
  landingSectionShellClass,
  landingSectionSpacingClass,
} from '../LandingSectionIntro.js';
import { getRevealItemProps, useLandingSectionReveal } from '../useLandingSectionReveal.js';
import { HOME_COPY } from './home-copy.js';

/**
 * Seção 5 da Home (`DEV-338`): Faixa de destaque da Regra de Qualidade (`0` bloqueios e `80+`).
 */
export function HomeQualityRuleSection() {
  const reveal = useLandingSectionReveal({ startRevealed: false });
  const copy = HOME_COPY.qualityRule;

  const [blocksCount, setBlocksCount] = useState(0);
  const [minScore, setMinScore] = useState(80);

  useEffect(() => {
    if (reveal.reduceMotion) {
      setBlocksCount(0);
      setMinScore(80);
      return;
    }
    if (!reveal.revealed) return;

    setBlocksCount(3);
    setMinScore(58);
    let rafId = 0;
    const durationMs = 850;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - (1 - elapsed) ** 3;
      setBlocksCount(Math.round(3 - eased * 3));
      setMinScore(Math.round(58 + eased * (80 - 58)));
      if (elapsed < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [reveal.revealed, reveal.reduceMotion]);

  const cardReveal0 = getRevealItemProps(reveal.revealed, 120, reveal.reduceMotion);
  const cardReveal1 = getRevealItemProps(reveal.revealed, 220, reveal.reduceMotion);

  const [mZero, mScore] = copy.metrics;

  return (
    <section
      id="regra-de-qualidade"
      ref={reveal.ref}
      aria-label={copy.eyebrow}
      className={`relative bg-[#111111] overflow-x-clip scroll-mt-20 ${landingSectionSpacingClass}`}
    >
      <div className={landingSectionShellClass}>
        <div className="max-w-5xl mx-auto rounded-2xl bg-[#181818] px-6 py-10 sm:px-10 sm:py-14 shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-1 ring-white/[0.06]">
          <LandingSectionIntro
            label={copy.eyebrow}
            title={copy.title}
            description={copy.description}
            align="center"
            className="mb-10 sm:mb-12"
            revealed={reveal.revealed}
            reduceMotion={reveal.reduceMotion}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <div
              className={`rounded-2xl bg-[#131313] p-6 sm:p-8 text-center shadow-[0_12px_30px_rgba(0,0,0,0.45)] ${cardReveal0.className}`}
              style={cardReveal0.style}
            >
              <div className="font-cinzel text-5xl sm:text-6xl font-bold text-[#6EE7B7] tabular-nums leading-none">
                {blocksCount}
              </div>
              <div className="mt-3 font-cinzel text-lg sm:text-xl font-bold text-[#e5e2e1]">
                {mZero.label}
              </div>
              <p className="nm-body mt-2 max-w-[36ch] mx-auto">{mZero.detail}</p>
            </div>

            <div
              className={`rounded-2xl bg-[#131313] p-6 sm:p-8 text-center shadow-[0_12px_30px_rgba(0,0,0,0.45)] ${cardReveal1.className}`}
              style={cardReveal1.style}
            >
              <div className="font-cinzel text-5xl sm:text-6xl font-bold text-[#f2ca50] tabular-nums leading-none">
                {minScore}+
              </div>
              <div className="mt-3 font-cinzel text-lg sm:text-xl font-bold text-[#e5e2e1]">
                {mScore.label}
              </div>
              <p className="nm-body mt-2 max-w-[36ch] mx-auto">{mScore.detail}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeQualityRuleSection;
