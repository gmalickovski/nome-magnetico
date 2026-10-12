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

/** Layout shell only — floating chrome lives on the mockup frames. */
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
  return (
    <div
      className={`transition-[opacity,transform] duration-[800ms] ease-out motion-reduce:transition-none motion-reduce:!opacity-100 motion-reduce:!translate-y-0 ${
        revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
      style={{ transitionDelay: revealed ? `${delayMs}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

export function ProductsSection() {
  const reveal1 = useLandingSectionReveal(0.08);
  const reveal2 = useLandingSectionReveal(0.08);

  return (
    <>
      {/* ── SEÇÃO 1: A HARMONIZAÇÃO ──────────────────────────────────────
          Expanded+: Texto à esquerda, mockup flutuante à direita.
          Compact/Medium (phone, tablet portrait, fold fechado): empilha texto → mockup.
      */}
      <section
        id="produtos"
        ref={reveal1.ref}
        className="relative py-20 md:py-24 bg-[#111111] scroll-mt-28 overflow-x-clip"
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
                    className={`text-[#f2ca50] text-xs md:text-sm font-bold tracking-[0.15em] mb-4 ${productCopyAlignClass}`}
                  >
                    Produto
                  </p>
                </TextBlock>

                <div className={productCopyProseClass}>
                  <TextBlock revealed={reveal1.revealed} delayMs={120}>
                    <div>
                      <p className="font-cinzel text-[10px] sm:text-xs uppercase tracking-[0.15em] text-[#D4AF37]/80 mb-2">
                        A Harmonização
                      </p>
                      <h3 className="font-cinzel text-3xl md:text-4xl min-[840px]:text-4xl xl:text-5xl font-bold text-[#e5e2e1] mb-4 leading-tight text-balance">
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
        className="relative py-20 md:py-24 bg-[#111111] scroll-mt-28 overflow-x-clip"
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
                    className={`text-[#f2ca50] text-xs md:text-sm font-bold tracking-[0.15em] mb-4 ${productCopyAlignClass}`}
                  >
                    Sugestões Inteligentes
                  </p>
                </TextBlock>

                <div className={productCopyProseClass}>
                  <TextBlock revealed={reveal2.revealed} delayMs={120}>
                    <div>
                      <p className="font-cinzel text-[10px] sm:text-xs uppercase tracking-[0.15em] text-[#D4AF37]/80 mb-2">
                        As Sugestões
                      </p>
                      <h3 className="font-cinzel text-3xl md:text-4xl min-[840px]:text-4xl xl:text-5xl font-bold text-[#e5e2e1] mb-4 leading-tight text-balance">
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
