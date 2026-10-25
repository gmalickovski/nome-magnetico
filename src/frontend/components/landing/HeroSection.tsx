import React from 'react';
import { track } from '../../lib/analytics';
import { HeroScoreAnimation } from './HeroScoreAnimation';
import {
  landingSectionShellClass,
  landingSplitGridClass,
} from './LandingSectionIntro';
import { getRevealItemProps, useLandingSectionReveal } from './useLandingSectionReveal';

export function HeroSection() {
  const reveal = useLandingSectionReveal();
  const titleReveal = getRevealItemProps(reveal.revealed, 0, reveal.reduceMotion);
  const descReveal = getRevealItemProps(reveal.revealed, 110, reveal.reduceMotion);
  const ctaReveal = getRevealItemProps(reveal.revealed, 220, reveal.reduceMotion);
  const cardReveal = getRevealItemProps(reveal.revealed, 160, reveal.reduceMotion);

  return (
    <section
      id="inicio"
      ref={reveal.ref}
      className="relative z-0 isolate min-h-svh flex flex-col overflow-hidden bg-[#111111] pt-[72px] sm:pt-28 md:pt-32 lg:pt-[84px] pb-12 sm:pb-16 md:pb-20 lg:pb-14"
      aria-label="Veja a nota do seu nome hoje e até onde ele pode chegar"
    >
      {/* BACKGROUND DECORATIVE LAYERS (Z-0) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-[#241a00] sm:from-[#1e1500] lg:from-[#1a1400] via-[#111111] to-[#0d0d1a]"></div>
        <div className="absolute top-1/4 sm:top-1/3 left-1/2 lg:left-[20%] -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[560px] sm:h-[560px] md:w-[720px] md:h-[720px] lg:w-[800px] lg:h-[800px] bg-[#D4AF37]/18 sm:bg-[#D4AF37]/16 md:bg-[#D4AF37]/15 lg:bg-[#D4AF37]/15 rounded-full blur-[90px] sm:blur-[120px] md:blur-[140px] lg:blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-purple-500/5 md:bg-purple-500/10 rounded-full blur-[80px] md:blur-[120px]"></div>
        <div className="absolute top-2/3 sm:top-1/2 right-1/2 sm:right-[15%] lg:right-[20%] translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] sm:w-[420px] sm:h-[420px] md:w-[600px] md:h-[600px] bg-[#D4AF37]/12 sm:bg-[#D4AF37]/10 md:bg-[#D4AF37]/10 rounded-full blur-[80px] md:blur-[120px]"></div>
      </div>

      {/* CONTENT LAYERS (Z-10) — Centralizado na Área Útil (altura total - header) */}
      <div className={`relative z-10 ${landingSectionShellClass} flex-1 flex flex-col justify-center gap-8 md:gap-12 my-auto w-full`}>
        
        {/* ROW 1:
            - < 1024px (mobile/tablet em pé): Texto empilhado em cima e Card empilhado embaixo.
            - 1024px–1279px (lg / ~11"): Texto permanece à esquerda (1.15fr) e Card à direita (0.85fr) no formato empilhado sem cortar textos.
            - >= 1280px (xl / desktop): Texto à esquerda e Card horizontal completo à direita com mesma aproximação central. */}
        <div className="max-w-[1120px] xl:max-w-[1260px] mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] xl:grid-cols-[1.01fr_0.99fr] gap-8 lg:gap-8 xl:gap-8 items-center w-full min-w-0 text-center lg:text-left">
          {/* Left Column: Headlines (ocupa espaço confortável para o título sem sobra excessiva à direita) */}
          <div className="w-full flex flex-col items-center lg:items-start min-w-0">
            <h1
              className={`nm-h1 ${titleReveal.className}`}
              style={titleReveal.style}
            >
              Veja a Nota do Seu Nome<br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #D4AF37, #E8C84A, #B8960E)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                e Até Onde Ele Pode Chegar
              </span>
            </h1>

            <p
              className={`nm-body-lg mt-5 md:mt-6 max-w-[54ch] ${descReveal.className}`}
              style={descReveal.style}
            >
              Calculamos o seu nome pela numerologia cabalística e mostramos lado a lado a nota de hoje e até onde ele pode chegar.
            </p>

            {/* Desktop Button - Hidden on mobile/tablet, shown on desktop */}
            <div
              className={`hidden lg:block mt-8 w-full sm:w-auto ${ctaReveal.className}`}
              style={ctaReveal.style}
            >
              <a
                href="/analise-gratuita"
                id="cta-hero-principal-desktop"
                data-cta-id="analise_gratis"
                data-cta-position="hero_desktop"
                className="inline-block w-full sm:w-auto text-center bg-[#D4AF37] text-[#1A1A1A] font-semibold text-base px-8 py-3.5 rounded-full hover:bg-[#f2ca50] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#D4AF37]/20 whitespace-nowrap"
                aria-label="Ver a nota do meu nome grátis"
                onClick={() => track('cta_hero_click', { produto: 'nome_social', posicao: 'hero_desktop' })}
              >
                Ver Minha Nota Grátis
              </a>
            </div>
          </div>
          
          {/* Right Column: Interactive Animation Card (empilhado no lg ~11", horizontal no xl desktop) */}
          <div
            className={`w-full min-w-0 flex justify-center lg:justify-center xl:justify-start ${cardReveal.className}`}
            style={cardReveal.style}
          >
            <HeroScoreAnimation />
          </div>
        </div>

        {/* Mobile Button - Shown only on mobile/tablet below the animated card */}
        <div
          className={`flex flex-col items-center lg:hidden w-full ${ctaReveal.className}`}
          style={ctaReveal.style}
        >
          <a
            href="/analise-gratuita"
            id="cta-hero-principal-mobile"
            data-cta-id="analise_gratis"
            data-cta-position="hero_mobile"
            className="w-full sm:w-auto text-center bg-[#D4AF37] text-[#1A1A1A] font-semibold text-base px-8 py-3.5 rounded-full hover:bg-[#f2ca50] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#D4AF37]/20"
            aria-label="Ver a nota do meu nome grátis"
            onClick={() => track('cta_hero_click', { produto: 'nome_social', posicao: 'hero_mobile' })}
          >
            Ver Minha Nota Grátis
          </a>

          {/* Seta indicadora do Hero no mobile: espaçamento dedicado e elegante abaixo do botão */}
          <div className="mt-8 mb-2 flex justify-center items-center animate-pulse motion-reduce:animate-none" aria-hidden="true">
            <svg className="w-6 h-6 text-[#D4AF37]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

      </div>

      {/* Scroll indicator meditativo - desktop apenas (no mobile fica abaixo do botão com espaçamento dedicado) */}
      <div className="hidden lg:block absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 animate-pulse motion-reduce:animate-none z-20" aria-hidden="true">
        <svg className="w-6 h-6 text-[#D4AF37]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}

