import React from 'react';
import { track } from '../../lib/analytics';
import { HeroScoreAnimation } from './HeroScoreAnimation';

export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#111111] pt-24 pb-28 md:pt-28 md:pb-20"
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
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 lg:px-12 w-full flex flex-col gap-8 md:gap-16">
        
        {/* ROW 1: Grid Split 40/60 for Title & Live Simulation Card */}
        <div className="grid lg:grid-cols-10 gap-12 items-center text-center lg:text-left">
          {/* Left Column: Headlines */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
            <p className="text-[#D4AF37] text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-6">
              Harmonização de Assinatura com Fundamento Vibracional
            </p>

            <h1 className="font-cinzel text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
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

            <p className="text-gray-400 text-sm md:text-base mt-6 leading-relaxed max-w-md">
              Cada letra do seu nome carrega uma frequência matemática. O <strong className="text-[#D4AF37]">Método Nome Magnético</strong> analisa sua vibração de nascimento, detecta bloqueios e revela a assinatura ideal para destravar seu caminho de prosperidade.
            </p>

            {/* Desktop Button - Hidden on mobile/tablet, shown on desktop */}
            <div className="hidden lg:block mt-8 w-full sm:w-auto">
              <a
                href="/analise-gratuita"
                id="cta-hero-principal-desktop"
                className="inline-block w-full sm:w-auto text-center bg-[#D4AF37] text-[#1A1A1A] font-semibold text-base px-8 py-3 rounded-full hover:bg-[#f2ca50] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#D4AF37]/20"
                aria-label="Descobrir a frequência do meu nome gratuitamente"
                onClick={() => track('cta_hero_click', { produto: 'nome_social', posicao: 'hero_desktop' })}
              >
                Descobrir a Frequência do Meu Nome
              </a>
            </div>
          </div>
          
          {/* Right Column: Interactive Animation Card */}
          <div className="lg:col-span-6 w-full flex justify-center">
            <HeroScoreAnimation />
          </div>
        </div>

        {/* Mobile Button - Shown only on mobile/tablet below the animated card */}
        <div className="flex justify-center lg:hidden w-full px-4">
          <a
            href="/analise-gratuita"
            id="cta-hero-principal-mobile"
            className="w-full sm:w-auto text-center bg-[#D4AF37] text-[#1A1A1A] font-semibold text-base px-8 py-3 rounded-full hover:bg-[#f2ca50] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#D4AF37]/20"
            aria-label="Descobrir a frequência do meu nome gratuitamente"
            onClick={() => track('cta_hero_click', { produto: 'nome_social', posicao: 'hero_mobile' })}
          >
            Descobrir a Frequência do Meu Nome
          </a>
        </div>

      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-20" aria-hidden="true">
        <svg className="w-6 h-6 text-[#D4AF37]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
