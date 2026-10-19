import React from 'react';
import {
  landingSectionShellClass,
  landingSectionSpacingClass,
  landingSplitGridClass,
} from './LandingSectionIntro';
import { getRevealItemProps, useLandingSectionReveal } from './useLandingSectionReveal';
import { ProductHarmonyFrame, ProductSuggestionsFrame } from './ProductResultFrame';

const productCopyAlignClass = 'text-center lg:text-left';
const productCopyProseClass = 'max-w-[58ch] mx-auto lg:mx-0';

/** Layout shell only — floating chrome lives on individual mockup cards. */
const mockupSlotClass = 'min-w-0 w-full max-w-full';

export function ProductsSection() {
  const reveal1 = useLandingSectionReveal();
  const reveal2 = useLandingSectionReveal();

  const s1Label = getRevealItemProps(reveal1.revealed, 0, reveal1.reduceMotion);
  const s1Title = getRevealItemProps(reveal1.revealed, 90, reveal1.reduceMotion);
  const s1Desc = getRevealItemProps(reveal1.revealed, 180, reveal1.reduceMotion);
  const s1Mockup = getRevealItemProps(reveal1.revealed, 140, reveal1.reduceMotion);

  const s2Label = getRevealItemProps(reveal2.revealed, 0, reveal2.reduceMotion);
  const s2Title = getRevealItemProps(reveal2.revealed, 90, reveal2.reduceMotion);
  const s2Desc = getRevealItemProps(reveal2.revealed, 180, reveal2.reduceMotion);
  const s2Mockup = getRevealItemProps(reveal2.revealed, 140, reveal2.reduceMotion);

  return (
    <>
      {/* ── SEÇÃO 1: A HARMONIZAÇÃO ──────────────────────────────────────
          Large+: Texto à esquerda (5 cols), mockup flutuante à direita (7 cols).
          Compact/Medium/Expanded (<1024px): empilha texto → mockup.
      */}
      <section
        id="produtos"
        ref={reveal1.ref}
        className="relative min-h-[auto] lg:min-h-[calc(100vh-4.5rem)] flex items-center justify-center bg-[#111111] py-12 md:py-16 lg:py-20 scroll-mt-20 overflow-x-clip"
      >
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute top-0 right-0 md:right-[10%] w-[min(100%,280px)] h-[280px] md:w-[420px] md:h-[420px] bg-[#D4AF37]/5 rounded-full blur-[80px] md:blur-[120px]" />
        </div>

        <div className={`relative ${landingSectionShellClass}`}>
          <div className={landingSplitGridClass}>
            <aside className="lg:col-span-5 min-w-0 order-1">
              <div className={`${productCopyProseClass} ${productCopyAlignClass}`}>
                <p
                  className={`text-[#f2ca50] text-xs md:text-sm font-bold uppercase tracking-[0.15em] mb-2 md:mb-2.5 ${s1Label.className}`}
                  style={s1Label.style}
                >
                  Harmonização
                </p>

                <h3
                  className={`font-cinzel text-lg sm:text-xl md:text-2xl lg:text-[1.75rem] xl:text-[2rem] font-bold text-[#e5e2e1] mb-3 leading-snug text-balance ${s1Title.className}`}
                  style={s1Title.style}
                >
                  Compare sua nota hoje com o potencial da sua assinatura.
                </h3>

                <p
                  className={`text-gray-300 text-xs sm:text-sm lg:text-base leading-relaxed text-pretty ${s1Desc.className}`}
                  style={s1Desc.style}
                >
                  Cada letra carrega uma frequência. Quando o nome de nascimento acumula sequências repetidas no
                  Triângulo da Vida ou entra em tensão com o Destino, isso aparece na sua nota de 0 a 100. A
                  Harmonização revela variações de nome social em nível N5 (Harmonioso), preservando sua
                  identidade. Você vê o antes e o depois lado a lado — com transparência em cada critério.
                </p>
              </div>
            </aside>

            <div
              className={`lg:col-span-7 ${mockupSlotClass} order-2 ${s1Mockup.className}`}
              style={s1Mockup.style}
            >
              <div className="w-full max-w-[480px] xl:max-w-[520px] mx-auto lg:ml-auto lg:mr-0">
                <ProductHarmonyFrame />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 2: AS SUGESTÕES ────────────────────────────────────────
          Large+: mockup à esquerda (7 cols), texto à direita (5 cols).
          Compact/Medium/Expanded (<1024px): texto → mockup (empilhado).
      */}
      <section
        id="sugestoes"
        ref={reveal2.ref}
        className="relative min-h-[auto] lg:min-h-[calc(100vh-4.5rem)] flex items-center justify-center bg-[#131313] py-12 md:py-16 lg:py-20 scroll-mt-20 overflow-x-clip"
      >
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute top-0 left-0 md:left-[10%] w-[min(100%,280px)] h-[280px] md:w-[420px] md:h-[420px] bg-[#d7c6ff]/5 rounded-full blur-[80px] md:blur-[120px]" />
        </div>

        <div className={`relative ${landingSectionShellClass}`}>
          <div className={landingSplitGridClass}>
            <div
              className={`lg:col-span-7 ${mockupSlotClass} order-2 lg:order-1 ${s2Mockup.className}`}
              style={s2Mockup.style}
            >
              <div className="w-full max-w-[620px] xl:max-w-[660px] mx-auto lg:mr-auto lg:ml-0">
                <ProductSuggestionsFrame />
              </div>
            </div>

            <aside className="lg:col-span-5 min-w-0 order-1 lg:order-2">
              <div className={`${productCopyProseClass} ${productCopyAlignClass}`}>
                <p
                  className={`text-[#f2ca50] text-xs md:text-sm font-bold uppercase tracking-[0.15em] mb-2 md:mb-2.5 ${s2Label.className}`}
                  style={s2Label.style}
                >
                  Sugestões Inteligentes
                </p>

                <h3
                  className={`font-cinzel text-lg sm:text-xl md:text-2xl lg:text-[1.75rem] xl:text-[2rem] font-bold text-[#e5e2e1] mb-3 leading-snug text-balance ${s2Title.className}`}
                  style={s2Title.style}
                >
                  Não é um nome imposto. É um ranking para você escolher.
                </h3>

                <p
                  className={`text-gray-300 text-xs sm:text-sm lg:text-base leading-relaxed text-pretty ${s2Desc.className}`}
                  style={s2Desc.style}
                >
                  O sistema gera sugestões e também analisa as variações que você indicar. Cada
                  card mostra score, compatibilidade Expressão × Destino, os 5 números e se ainda
                  há bloqueios. Compare, escolha a assinatura que ressoa — e rode a análise completa
                  quando quiser. Self-service, na hora.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

