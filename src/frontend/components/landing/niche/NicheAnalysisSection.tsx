import { LandingSectionIntro, landingSectionShellClass, landingSectionSpacingClass } from '../LandingSectionIntro.js';
import { StarScene } from '../mockups/StarScene.js';
import { TriangleScene } from '../mockups/TriangleScene.js';
import { getRevealItemProps, useLandingSectionReveal } from '../useLandingSectionReveal.js';
import type { NichePageCopy } from './niche-types.js';

function BlockText({
  badge,
  title,
  description,
  tone,
}: {
  badge: string;
  title: string;
  description: string;
  tone: 'gold' | 'purple';
}) {
  return (
    <>
      <p className={`nm-eyebrow mb-2.5 ${tone === 'purple' ? '!text-[#d7c6ff]' : ''}`}>{badge}</p>
      <h3 className="nm-h3 text-[#e5e2e1] mb-3">{title}</h3>
      <p className="nm-body-lg max-w-[46ch] mx-auto lg:mx-0">{description}</p>
    </>
  );
}

export interface NicheAnalysisSectionProps {
  copy: NichePageCopy;
}

/**
 * Seção 3 das páginas de nicho: O que o cálculo mostra.
 * - Social / Bebê: Estrela (`StarScene`) + Triângulo (`TriangleScene`).
 * - Artístico: Estrela (`StarScene`) + card visual "Afinidade número × área".
 */
export function NicheAnalysisSection({ copy }: NicheAnalysisSectionProps) {
  const reveal = useLandingSectionReveal();
  const rightAnim = getRevealItemProps(reveal.revealed, 1, reveal.reduceMotion);
  const leftAnim = getRevealItemProps(reveal.revealed, 0, reveal.reduceMotion);

  return (
    <section
      id="o-que-mostra"
      ref={reveal.ref}
      className={`${landingSectionSpacingClass} bg-[#111111]`}
    >
      <div className={landingSectionShellClass}>
        <LandingSectionIntro
          label={copy.analysis.eyebrow}
          title={copy.analysis.title}
          description={copy.analysis.description}
          align="center"
          revealed={reveal.revealed}
          reduceMotion={reveal.reduceMotion}
        />

        {/* Duas subseções, uma abaixo da outra. Em cada uma, texto e mockup em containers próprios,
            lado a lado e alternando de lado no desktop; no celular empilham (texto em cima). */}
        <div className="mt-12 sm:mt-16 flex flex-col gap-16 lg:gap-24 max-w-6xl mx-auto">
          <div
            style={leftAnim.style}
            className={`${leftAnim.className} grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center`}
          >
            <div className="min-w-0 text-center lg:text-left">
              <BlockText
                badge={copy.analysis.leftBlock.badge}
                title={copy.analysis.leftBlock.title}
                description={copy.analysis.leftBlock.description}
                tone="gold"
              />
            </div>
            <div className="min-w-0">
              <StarScene device="both" theme={copy.id} srSummary={copy.analysis.leftBlock.srSummary} />
            </div>
          </div>

          <div
            style={rightAnim.style}
            className={`${rightAnim.className} grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center`}
          >
            <div className="min-w-0 text-center lg:text-left lg:order-2">
              <BlockText
                badge={copy.analysis.rightBlock.badge}
                title={copy.analysis.rightBlock.title}
                description={copy.analysis.rightBlock.description}
                tone="purple"
              />
            </div>
            <div className="min-w-0 lg:order-1">
              {copy.id === 'artistico' && copy.analysis.rightBlock.affinityCards ? (
                <div className="nm-floating-card p-6 sm:p-7 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-[#d7c6ff] font-semibold">
                      Afinidade número × área
                    </span>
                    <span className="rounded-full bg-[#bea5ff]/15 px-3 py-1 text-[11px] font-medium text-[#d7c6ff]">
                      Critério objetivo
                    </span>
                  </div>
                  <div className="space-y-3">
                    {copy.analysis.rightBlock.affinityCards.map((card) => (
                      <div
                        key={card.area}
                        className="rounded-2xl bg-[#222229] p-4 sm:p-5 transition-colors duration-500 hover:bg-[#282732]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <p className="font-cinzel text-base font-semibold text-[#e5e2e1]">{card.area}</p>
                          <span className="rounded-full bg-[#f2ca50]/15 px-3 py-0.5 text-xs font-semibold text-[#f2ca50]">
                            {card.numbers}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-[#b7b4b0]">{card.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <TriangleScene device="both" theme={copy.id} srSummary={copy.analysis.rightBlock.srSummary} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
