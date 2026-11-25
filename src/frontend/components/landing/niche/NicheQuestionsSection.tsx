import { LandingSectionIntro, landingSectionShellClass, landingSectionSpacingClass } from '../LandingSectionIntro.js';
import { getRevealItemProps, useLandingSectionReveal } from '../useLandingSectionReveal.js';
import type { NichePageCopy } from './niche-types.js';

export interface NicheQuestionsSectionProps {
  copy: NichePageCopy;
}

/**
 * Seção 2 das páginas de nicho: O que perguntamos (entrada escalonada no scroll).
 */
export function NicheQuestionsSection({ copy }: NicheQuestionsSectionProps) {
  const reveal = useLandingSectionReveal();
  const isPastel = copy.id === 'bebe';
  const numClass = isPastel ? 'text-[#f9a8d4]/80' : copy.id === 'artistico' ? 'text-[#d7c6ff]' : 'text-[#f2ca50]';

  return (
    <section
      id="o-que-perguntamos"
      ref={reveal.ref}
      className={`${landingSectionSpacingClass} bg-[#131313]`}
    >
      <div className={landingSectionShellClass}>
        <LandingSectionIntro
          label={copy.questions.eyebrow}
          title={copy.questions.title}
          description={copy.questions.description}
          align="center"
          revealed={reveal.revealed}
          reduceMotion={reveal.reduceMotion}
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
          {copy.questions.items.map((item, idx) => {
            const anim = getRevealItemProps(reveal.revealed, idx + 1, reveal.reduceMotion);
            return (
              <article
                key={item.number}
                style={anim.style}
                className={`${anim.className} rounded-2xl p-6 sm:p-7 bg-[#1b1b1e] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-700 hover:-translate-y-1`}
              >
                <p className={`font-cinzel text-3xl font-bold mb-3 ${numClass}`}>{item.number}</p>
                <h3 className="font-cinzel text-lg sm:text-xl font-semibold text-[#e5e2e1] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-[#b7b4b0]">{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
