import React from 'react';
import { track } from '../../lib/analytics';
import { HeroScoreAnimation } from './HeroScoreAnimation';

export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#111111] py-16 md:py-24"
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
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 lg:px-12 pt-24 pb-8 md:pt-32 w-full flex flex-col gap-12 md:gap-16">
        
        {/* ROW 1: Grid Split 50/50 for Title & Live Simulation Card */}
        <div className="grid lg:grid-cols-2 gap-12 items-center text-center lg:text-left">
          {/* Left Column: Headlines */}
          <div className="flex flex-col items-center lg:items-start">
            <p className="text-[#D4AF37] text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-6">
              Harmonização de Assinatura com Fundamento Vibracional
            </p>

            <h1 className="font-cinzel text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
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
          </div>
          
          {/* Right Column: Interactive Animation Card */}
          <div className="w-full flex justify-center">
            <HeroScoreAnimation />
          </div>
        </div>

        {/* ROW 2: Full Width Section for Description Paragraph, CTAs, Indicators and Social Proof */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mt-4 w-full">
          {/* Description Paragraph */}
          <p className="text-gray-400 text-base md:text-lg mb-10 leading-relaxed max-w-3xl">
            Cada letra do seu nome carrega uma frequência matemática. O <strong className="text-[#D4AF37]">Método Nome Magnético</strong> mostra como harmonizar sua assinatura: transforma seu nome de nascimento em um dossiê completo para escolher uma assinatura harmonizada, com ranking de candidatos, score 0–100, 4 triângulos cabalísticos, arcanos, bloqueios e variações prontas para testar.
          </p>

          {/* CTA & Trust buttons */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a
              href="/analise-gratuita"
              id="cta-hero-principal"
              className="w-full sm:w-auto text-center bg-[#D4AF37] text-[#1A1A1A] font-semibold text-lg px-12 py-4 rounded-xl hover:bg-[#f2ca50] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[#D4AF37]/20"
              aria-label="Descobrir a frequência do meu nome gratuitamente"
              onClick={() => track('cta_hero_click', { produto: 'nome_social', posicao: 'hero' })}
            >
              Descobrir a Frequência do Meu Nome
            </a>
            <span className="text-gray-500 text-sm">
              Análise gratuita com PDF
            </span>
          </div>

          {/* Trust Indicators */}
          <div
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#D4AF37]/80 uppercase tracking-wider font-semibold mb-12"
            aria-label="Diferenciais do produto"
          >
            <span>✓ Ranking com Score</span>
            <span className="text-[#D4AF37]/30" aria-hidden="true">•</span>
            <span>✓ Assinatura Harmonizada</span>
            <span className="text-[#D4AF37]/30" aria-hidden="true">•</span>
            <span>✓ 4 Triângulos</span>
            <span className="text-[#D4AF37]/30" aria-hidden="true">•</span>
            <span>✓ Sem bloqueios</span>
          </div>

          {/* Social proof stats */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500 w-full" role="list" aria-label="Indicadores de qualidade">
            <div className="text-center" role="listitem">
              <div className="font-cinzel text-2xl font-bold text-[#D4AF37]" aria-label="3 produtos de análise">3</div>
              <div className="text-xs text-gray-500 mt-0.5">produtos de análise</div>
            </div>
            <div className="h-8 w-px bg-white/10" aria-hidden="true" />
            <div className="text-center" role="listitem">
              <div className="font-cinzel text-2xl font-bold text-[#D4AF37]" aria-label="97% de satisfação">97%</div>
              <div className="text-xs text-gray-500 mt-0.5">de satisfação</div>
            </div>
            <div className="h-8 w-px bg-white/10" aria-hidden="true" />
            <div className="text-center" role="listitem">
              <div className="font-cinzel text-2xl font-bold text-[#D4AF37]" aria-label="30 dias de acesso completo">30 dias</div>
              <div className="text-xs text-gray-500 mt-0.5">acesso completo</div>
            </div>
          </div>
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
