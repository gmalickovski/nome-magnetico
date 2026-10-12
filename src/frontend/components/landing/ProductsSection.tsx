import React from 'react';
import {
  landingSectionShellClass,
  landingSectionStackGapClass,
} from './LandingSectionIntro';
import { useLandingSectionReveal } from './useLandingSectionReveal';
import { ProductHarmonyFrame, ProductSuggestionsFrame } from './ProductResultFrame';

/**
 * Two-panel layout from Expanded (~840px) up — Compact/Medium stack.
 * Aligns with the frontend playbook (M3 breakpoints).
 */
const productSectionGridClass =
  'grid grid-cols-1 min-[840px]:grid-cols-2 items-start min-[840px]:items-center';

const productCopyAlignClass = 'text-center min-[840px]:text-left';
const productCopyProseClass = 'max-w-prose mx-auto min-[840px]:mx-0';

/** Layout shell only — floating chrome lives on individual mockup cards. */
const mockupSlotClass = 'min-w-0 w-full max-w-full';

function TextBlock({
  revealed,
  delayMs,
  children,
}: {
  revealed: boolean;
  delayMs: number;
  children: React.ReactNode;
}) {
  // Keep copy readable immediately — never blank-out with opacity-0 while the
  // section scrolls into view. Only a light settle motion on reveal.
  return (
    <div
      className={`transition-transform duration-300 ease-out motion-reduce:transition-none motion-reduce:!translate-y-0 ${
        revealed ? 'translate-y-0' : 'translate-y-1.5'
      }`}
      style={{ transitionDelay: revealed ? `${delayMs}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

export function ProductsSection() {
  const reveal1 = useLandingSectionReveal();
  const reveal2 = useLandingSectionReveal();

  return (
    <>
      {/* ── SEÇÃO 1: A HARMONIZAÇÃO ──────────────────────────────────────
          Expanded+: Texto à esquerda, mockup flutuante à direita.
          Compact/Medium (phone, tablet portrait, fold fechado): empilha texto → mockup.
      */}
      <section
        id="produtos"
        ref={reveal1.ref}
        className="relative py-14 md:py-16 min-[840px]:py-12 xl:py-16 bg-[#111111] scroll-mt-28 overflow-x-clip"
      >
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute top-0 right-0 md:right-[10%] w-[min(100%,280px)] h-[280px] md:w-[420px] md:h-[420px] bg-[#D4AF37]/5 rounded-full blur-[80px] md:blur-[120px]" />
        </div>

        <div className={`relative ${landingSectionShellClass}`}>
          <div className={`${productSectionGridClass} ${landingSectionStackGapClass}`}>
            <aside className="min-w-0 order-1">
              <div>
                <TextBlock revealed={reveal1.revealed} delayMs={0}>
                  <p
                    className={`text-[#f2ca50] text-xs md:text-sm font-bold tracking-[0.15em] mb-3 ${productCopyAlignClass}`}
                  >
                    Harmonização
                  </p>
                </TextBlock>

                <div className={productCopyProseClass}>
                  <TextBlock revealed={reveal1.revealed} delayMs={40}>
                    <div>
                      <h3 className="font-cinzel text-3xl md:text-4xl min-[840px]:text-[2.15rem] xl:text-5xl font-bold text-[#e5e2e1] mb-3 leading-tight text-balance">
                        Seu nome pode estar travando o que você quer realizar.
                      </h3>
                      <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                        Cada letra carrega uma frequência. Quando o nome de nascimento acumula bloqueios,
                        a vibração trava — e isso aparece no score de 0 a 100. A Harmonização cria um
                        escudo: uma variação de nome social alinhada ao seu Destino, sem apagar quem você
                        é. Você vê o antes e o depois lado a lado — e sente a diferença no número.
                      </p>
                    </div>
                  </TextBlock>
                </div>
              </div>
            </aside>

            <div className={`${mockupSlotClass} order-2`}>
              <ProductHarmonyFrame />
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 2: AS SUGESTÕES ────────────────────────────────────────
          Expanded+: mockup à esquerda, texto à direita.
          Compact/Medium: texto → mockup (empilhado).
      */}
      <section
        id="sugestoes"
        ref={reveal2.ref}
        className="relative py-14 md:py-16 min-[840px]:py-12 xl:py-16 bg-[#111111] scroll-mt-28 overflow-x-clip"
      >
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute top-0 left-0 md:left-[10%] w-[min(100%,280px)] h-[280px] md:w-[420px] md:h-[420px] bg-[#d7c6ff]/5 rounded-full blur-[80px] md:blur-[120px]" />
        </div>

        <div className={`relative ${landingSectionShellClass}`}>
          <div className={`${productSectionGridClass} ${landingSectionStackGapClass}`}>
            <div className={`${mockupSlotClass} order-2 min-[840px]:order-1`}>
              <ProductSuggestionsFrame />
            </div>

            <aside className="min-w-0 order-1 min-[840px]:order-2">
              <div>
                <TextBlock revealed={reveal2.revealed} delayMs={0}>
                  <p
                    className={`text-[#f2ca50] text-xs md:text-sm font-bold tracking-[0.15em] mb-3 ${productCopyAlignClass}`}
                  >
                    Sugestões Inteligentes
                  </p>
                </TextBlock>

                <div className={productCopyProseClass}>
                  <TextBlock revealed={reveal2.revealed} delayMs={40}>
                    <div>
                      <h3 className="font-cinzel text-3xl md:text-4xl min-[840px]:text-[2.15rem] xl:text-5xl font-bold text-[#e5e2e1] mb-3 leading-tight text-balance">
                        Não é um nome imposto. É um ranking para você escolher.
                      </h3>
                      <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                        O sistema gera sugestões e também analisa as variações que você indicar. Cada
                        card mostra score, compatibilidade Expressão × Destino, os 5 números e se ainda
                        há bloqueios. Compare, escolha a assinatura que ressoa — e rode a análise completa
                        quando quiser. Self-service, na hora.
                      </p>
                    </div>
                  </TextBlock>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
