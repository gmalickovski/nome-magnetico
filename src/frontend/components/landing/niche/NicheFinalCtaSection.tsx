import { landingSectionShellClass, landingSectionSpacingClass } from '../LandingSectionIntro.js';
import type { NichePageCopy } from './niche-types.js';

export interface NicheFinalCtaSectionProps {
  copy: NichePageCopy;
}

/**
 * Seção 9 das páginas de nicho: CTA final abrindo o chat já no caminho certo.
 */
export function NicheFinalCtaSection({ copy }: NicheFinalCtaSectionProps) {
  return (
    <section id="cta-final" className={`${landingSectionSpacingClass} bg-[#111111]`}>
      <div className={landingSectionShellClass}>
        <div className="max-w-3xl mx-auto rounded-2xl bg-[#1a1a1d] px-6 py-10 sm:px-10 sm:py-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <p className="text-xs uppercase tracking-[0.14em] font-semibold text-[#f2ca50] mb-3">
            {copy.finalCta.eyebrow}
          </p>
          <h2 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-bold text-[#e5e2e1]">
            {copy.finalCta.title}
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-[#b7b4b0] max-w-[54ch] mx-auto">
            {copy.finalCta.description}
          </p>
          <div className="mt-8 flex justify-center">
            <a
              href={copy.ctaHref}
              data-cta-id={copy.finalCta.ctaId}
              data-cta-position="cta_final"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#D4AF37] hover:bg-[#f2ca50] px-8 py-3.5 text-base font-semibold text-[#131313] shadow-lg shadow-[#D4AF37]/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              {copy.finalCta.ctaLabel}
            </a>
          </div>
          <p className="mt-5 text-xs sm:text-sm text-[#9e9b95]">{copy.finalCta.footnote}</p>
          <p className="mt-3 text-xs sm:text-sm">
            <a
              href="/como-funciona-o-score"
              data-cta-id="como_calculamos"
              data-cta-position="cta_final"
              className="text-[#D4AF37] underline underline-offset-2 hover:text-[#f2ca50] transition-colors duration-500"
            >
              Como calculamos a nota
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
