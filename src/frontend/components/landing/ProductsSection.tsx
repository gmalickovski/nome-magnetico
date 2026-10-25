import React from 'react';
import {
  landingSectionShellClass,
  landingSectionSpacingClass,
  landingSplitGridClass,
} from './LandingSectionIntro';
import { getRevealItemProps, useLandingSectionReveal } from './useLandingSectionReveal';
import {
  ProductHarmonyScoreCard,
  ProductHarmonyStar,
  ProductSuggestionsFrame,
} from './ProductResultFrame';

const productCopyAlignClass = 'text-center lg:text-left';
const productCopyProseClass = 'max-w-[58ch] mx-auto lg:mx-0';

/** Layout shell only — floating chrome lives on individual mockup cards. */
const mockupSlotClass = 'min-w-0 w-full max-w-full';

export function ProductsSection() {
  // startRevealed=false: client:visible hidrata na borda da tela; forca estado oculto e revela no scroll (todas as larguras).
  const reveal1 = useLandingSectionReveal({ startRevealed: false, threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
  const reveal2 = useLandingSectionReveal({ startRevealed: false, threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

  const s1Label = getRevealItemProps(reveal1.revealed, 0, reveal1.reduceMotion);
  const s1Title = getRevealItemProps(reveal1.revealed, 110, reveal1.reduceMotion);
  const s1Desc = getRevealItemProps(reveal1.revealed, 220, reveal1.reduceMotion);
  const s1ScoreCard = getRevealItemProps(reveal1.revealed, 340, reveal1.reduceMotion);

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
        className="relative flex flex-col justify-center bg-[#111111] pt-8 sm:pt-10 md:pt-12 lg:pt-14 pb-12 sm:pb-16 md:pb-20 lg:pb-24 scroll-mt-20 overflow-x-clip"
      >
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute top-0 right-0 md:right-[10%] w-[min(100%,280px)] h-[280px] md:w-[420px] md:h-[420px] bg-[#D4AF37]/5 rounded-full blur-[80px] md:blur-[120px]" />
        </div>

        <div className={`relative ${landingSectionShellClass}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 xl:gap-12 items-center w-full min-w-0">
            {/* Coluna Esquerda: 50% da largura no desktop */}
            <aside className="w-full min-w-0 order-1">
              <div className="w-full text-center lg:text-left">
                <p
                  className={`nm-eyebrow mb-2.5 sm:mb-3 md:mb-3.5 ${s1Label.className}`}
                  style={s1Label.style}
                >
                  Harmonização
                </p>

                <h2
                  className={`nm-h2 max-w-[28ch] sm:max-w-[34ch] lg:max-w-none mx-auto lg:mx-0 ${s1Title.className}`}
                  style={s1Title.style}
                >
                  O Antes e o Depois do Seu Nome, Lado a Lado
                </h2>

                <p
                  className={`nm-body-lg mt-4 sm:mt-5 max-w-[58ch] mx-auto lg:mx-0 ${s1Desc.className}`}
                  style={s1Desc.style}
                >
                  Cada letra e cada acento entram no cálculo. O que vem da sua data de nascimento fica à parte, porque nenhum nome muda isso. O que vem só do nome pode ser harmonizado numa assinatura só sua, sem mudar o seu registro. Você vê o antes e o depois lado a lado, com a nota de cada um.
                </p>

                {/* Card de Score: ocupa a largura total da coluna esquerda (50%), logo abaixo do texto */}
                <div
                  className={`mt-6 sm:mt-8 w-full max-w-xl mx-auto lg:mx-0 text-left ${s1ScoreCard.className}`}
                  style={s1ScoreCard.style}
                >
                  <ProductHarmonyScoreCard />
                </div>
              </div>
            </aside>

            {/* Coluna Direita: 50% da largura no desktop, com estrela centralizada */}
            <div
              className={`w-full min-w-0 order-2 flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6`}
            >
              <div className="w-full max-w-[580px] xl:max-w-[620px] mx-auto flex flex-col items-center justify-center">
                <ProductHarmonyStar />
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
                  className={`nm-eyebrow mb-2 md:mb-2.5 ${s2Label.className}`}
                  style={s2Label.style}
                >
                  Sugestões Inteligentes
                </p>

                <h2
                  className={`nm-h2 mb-3 ${s2Title.className}`}
                  style={s2Title.style}
                >
                  Três Opções de Assinatura Para Você Escolher a Sua
                </h2>

                <p
                  className={`nm-body-lg mt-4 sm:mt-5 ${s2Desc.className}`}
                  style={s2Desc.style}
                >
                  Você não recebe um nome imposto. O sistema testa primeiro a mudança mais leve: encurtar o nome, usar só o primeiro nome ou incluir um acento sutil. Um acento sutil, só na assinatura, muda o cálculo sem mudar o seu nome. Cada card mostra a nota, o nível, a combinação com o seu Destino e os 5 números para você escolher.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

