import {
  LandingSectionIntro,
  landingSectionShellClass,
  landingSectionSpacingClass,
  landingSplitGridClass,
} from '../LandingSectionIntro.js';
import { PdfFlipScene } from '../mockups/PdfFlipScene.js';
import { getRevealItemProps, useLandingSectionReveal } from '../useLandingSectionReveal.js';
import type { NichePageCopy } from './niche-types.js';

export interface NicheDeliverablesSectionProps {
  copy: NichePageCopy;
}

/**
 * Seção 5 das páginas de nicho: O que você leva (PDF no tema do nicho).
 */
export function NicheDeliverablesSection({ copy }: NicheDeliverablesSectionProps) {
  const reveal = useLandingSectionReveal();
  const listAnim = getRevealItemProps(reveal.revealed, 0, reveal.reduceMotion);
  const sceneAnim = getRevealItemProps(reveal.revealed, 1, reveal.reduceMotion);

  return (
    <section
      id="o-que-voce-leva"
      ref={reveal.ref}
      className={`${landingSectionSpacingClass} bg-[#111111]`}
    >
      <div className={landingSectionShellClass}>
        <div className={landingSplitGridClass}>
          <div style={listAnim.style} className={`${listAnim.className} lg:col-span-5 min-w-0`}>
            <LandingSectionIntro
              label={copy.deliverables.eyebrow}
              title={copy.deliverables.title}
              description={copy.deliverables.description}
              align="left"
              revealed={reveal.revealed}
              reduceMotion={reveal.reduceMotion}
            />
            <ul className="mt-6 space-y-3">
              {copy.deliverables.highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm sm:text-base text-[#e5e2e1]/90"
                >
                  <span
                    className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                      copy.id === 'bebe'
                        ? 'bg-[#f9a8d4]'
                        : copy.id === 'artistico'
                          ? 'bg-[#bea5ff]'
                          : 'bg-[#f2ca50]'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={sceneAnim.style} className={`${sceneAnim.className} lg:col-span-7 min-w-0`}>
            <PdfFlipScene
              device="both"
              theme={copy.id}
              srSummary={copy.deliverables.srSummary}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
