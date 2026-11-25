import { LandingSectionIntro, landingSectionShellClass, landingSectionSpacingClass } from '../LandingSectionIntro.js';
import { SuggestionCardsScene } from '../mockups/SuggestionCardsScene.js';
import { getRevealItemProps, useLandingSectionReveal } from '../useLandingSectionReveal.js';
import type { NichePageCopy } from './niche-types.js';

export interface NicheSuggestionsSectionProps {
  copy: NichePageCopy;
}

/**
 * Seção 4 das páginas de nicho: Os nomes que você recebe.
 */
export function NicheSuggestionsSection({ copy }: NicheSuggestionsSectionProps) {
  const reveal = useLandingSectionReveal();
  const sceneAnim = getRevealItemProps(reveal.revealed, 0, reveal.reduceMotion);

  return (
    <section
      id="nomes-recebidos"
      ref={reveal.ref}
      className={`${landingSectionSpacingClass} bg-[#131313]`}
    >
      <div className={landingSectionShellClass}>
        <LandingSectionIntro
          label={copy.suggestions.eyebrow}
          title={copy.suggestions.title}
          description={copy.suggestions.description}
          align="center"
          revealed={reveal.revealed}
          reduceMotion={reveal.reduceMotion}
        />

        <div style={sceneAnim.style} className={`${sceneAnim.className} mt-10 max-w-5xl mx-auto`}>
          <SuggestionCardsScene
            device="both"
            theme={copy.id}
            srSummary={copy.suggestions.srSummary}
          />
        </div>
      </div>
    </section>
  );
}
