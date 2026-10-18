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
      className="relative min-h-svh flex items-center justify-center overflow-hidden bg-[#111111] pt-24 pb-20 md:pt-28 md:pb-24"
      aria-label="Seção principal — Nome Magnético"
    >
      {/* BACKGROUND DECORATIVE LAYERS (Z-0) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1400] via-[#111111] to-[#0d0d1a]"></div>
        <div className="absolute top-1/3 left-[20%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[800px] md:h-[800px] bg-[#D4AF37]/8 md:bg-[#D4AF37]/15 rounded-full blur-[100px] md:blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-purple-500/5 md:bg-purple-500/10 rounded-full blur-[80px] md:blur-[120px]"></div>
        <div className="absolute top-1/2 right-[20%] translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-[#D4AF37]/5 md:bg-[#D4AF37]/10 rounded-full blur-[80px] md:blur-[120px]"></div>
      </div>

      {/* CONTENT LAYERS (Z-10) */}
      <div className={`relative z-10 ${landingSectionShellClass} flex flex-col gap-8 md:gap-12`}>
        
        {/* ROW 1: M3 12-Column Split Grid (5 cols Copy / 7 cols Live Simulation Card) */}
        <div className={`${landingSplitGridClass} text-center lg:text-left`}>
          {/* Left Column: Headlines (5 columns on lg+) */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start min-w-0">
            <h1
              className={`font-cinzel text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] xl:text-[2.75rem] font-bold text-white leading-[1.15] text-balance ${titleReveal.className}`}
              style={titleReveal.style}
            >
              Sua Assinatura Tem<br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #D4AF37, #E8C84A, #B8960E)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Mais Poder Do Que Você Imagina
              </span>
            </h1>

            <p
              className={`text-gray-400 text-sm sm:text-base mt-5 md:mt-6 leading-relaxed max-w-[54ch] text-pretty ${descReveal.className}`}
              style={descReveal.style}
            >
              Cada letra do seu nome carrega uma frequência matemática. O <strong className="text-[#D4AF37]">Método Nome Magnético</strong> calcula a nota atual do seu nome de nascimento, mapeia tensões vibracionais e mostra o potencial que sua assinatura pode alcançar (até o nível N5).
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
                aria-label="Descobrir a frequência do meu nome gratuitamente"
                onClick={() => track('cta_hero_click', { produto: 'nome_social', posicao: 'hero_desktop' })}
              >
                Descobrir a Frequência do Meu Nome
              </a>
            </div>
          </div>
          
          {/* Right Column: Interactive Animation Card (7 columns on lg+, flush with right guide) */}
          <div
            className={`lg:col-span-7 w-full min-w-0 flex justify-center lg:justify-end ${cardReveal.className}`}
            style={cardReveal.style}
          >
            <HeroScoreAnimation />
          </div>
        </div>

        {/* Mobile Button - Shown only on mobile/tablet below the animated card */}
        <div
          className={`flex justify-center lg:hidden w-full ${ctaReveal.className}`}
          style={ctaReveal.style}
        >
          <a
            href="/analise-gratuita"
            id="cta-hero-principal-mobile"
            data-cta-id="analise_gratis"
            data-cta-position="hero_mobile"
            className="w-full sm:w-auto text-center bg-[#D4AF37] text-[#1A1A1A] font-semibold text-base px-8 py-3.5 rounded-full hover:bg-[#f2ca50] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#D4AF37]/20"
            aria-label="Descobrir a frequência do meu nome gratuitamente"
            onClick={() => track('cta_hero_click', { produto: 'nome_social', posicao: 'hero_mobile' })}
          >
            Descobrir a Frequência do Meu Nome
          </a>
        </div>

      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-20" aria-hidden="true">
        <svg className="w-6 h-6 text-[#D4AF37]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}

