import React from 'react';
import { track } from '../../lib/analytics';

export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#111111]"
      aria-label="Seção principal — Nome Magnético"
    >
      {/* Background decorativo unificado (Estilo Auth - responsivo: sutil no mobile, intenso no desktop) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1400] via-[#111111] to-[#0d0d1a]"></div>
        <div className="absolute top-1/3 left-[20%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[800px] md:h-[800px] bg-[#D4AF37]/8 md:bg-[#D4AF37]/15 rounded-full blur-[100px] md:blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-purple-500/5 md:bg-purple-500/10 rounded-full blur-[80px] md:blur-[120px]"></div>
        <div className="absolute top-1/2 right-[20%] translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-[#D4AF37]/5 md:bg-[#D4AF37]/10 rounded-full blur-[80px] md:blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-purple-500/5 md:bg-purple-500/10 rounded-full blur-[60px] md:blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-32 pb-16 md:pt-40">
        {/* Super Headline — keyword SEO + gancho emocional */}
        <p className="text-[#D4AF37] text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-8">
          Harmonização de Assinatura com Fundamento Vibracional
        </p>

        {/* H1 Headline principal */}
        <h1 className="font-cinzel text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
          Sua Assinatura Tem Mais Poder{' '}
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #E8C84A, #B8960E)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Do Que Você Imagina
          </span>
        </h1>

        {/* Subheadline — conciso */}
        <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
          Cada letra do seu nome carrega uma frequência matemática. O <strong className="text-[#D4AF37]">Método Nome Magnético</strong> mostra como harmonizar sua assinatura: transforma seu nome de nascimento em um dossiê completo para escolher uma assinatura harmonizada, com ranking de candidatos, score 0–100, 4 triângulos cabalísticos, arcanos, bloqueios e variações prontas para testar.
        </p>

        {/* CTA Principal */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <a
            href="/analise-gratuita"
            id="cta-hero-principal"
            className="w-full sm:w-auto bg-[#D4AF37] text-[#1A1A1A] font-semibold text-lg px-8 py-4 rounded-xl hover:bg-[#f2ca50] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[#D4AF37]/20"
            aria-label="Descobrir a frequência do meu nome gratuitamente"
            onClick={() => track('cta_hero_click', { produto: 'nome_social', posicao: 'hero' })}
          >
            Descobrir a Frequência do Meu Nome
          </a>
        </div>

        {/* Micro-copy de confiança */}
        <p className="text-gray-600 text-sm mb-8">
          Análise completa gratuita · Crie sua conta · Relatório com PDF
        </p>

        {/* Trust Indicators atualizados */}
        <div
          className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#D4AF37]/80 uppercase tracking-wider font-semibold mb-10"
          aria-label="Diferenciais do produto"
        >
          <span>✓ Ranking de Nomes com Score</span>
          <span className="hidden sm:inline" aria-hidden="true">•</span>
          <span>✓ Assinatura Harmonizada</span>
          <span className="hidden sm:inline" aria-hidden="true">•</span>
          <span>✓ Harmonização de Assinatura</span>
          <span className="hidden sm:inline" aria-hidden="true">•</span>
          <span>✓ 4 Triângulos Cabalísticos</span>
          <span className="hidden sm:inline" aria-hidden="true">•</span>
          <span>✓ Bloqueios, Arcanos e Lições Kármicas</span>
          <span className="hidden sm:inline" aria-hidden="true">•</span>
          <span>✓ Relatório em PDF para Download</span>
        </div>

        {/* Social proof com números reais */}
        <div className="flex items-center justify-center gap-8 text-sm text-gray-500" role="list" aria-label="Indicadores de qualidade">
          <div className="text-center" role="listitem">
            <div className="font-cinzel text-2xl font-bold text-[#D4AF37]" aria-label="3 produtos de análise">3</div>
            <div>produtos de análise</div>
          </div>
          <div className="h-8 w-px bg-white/10" aria-hidden="true" />
          <div className="text-center" role="listitem">
            <div className="font-cinzel text-2xl font-bold text-[#D4AF37]" aria-label="97% de satisfação">97%</div>
            <div>de satisfação</div>
          </div>
          <div className="h-8 w-px bg-white/10" aria-hidden="true" />
          <div className="text-center" role="listitem">
            <div className="font-cinzel text-2xl font-bold text-[#D4AF37]" aria-label="30 dias de acesso completo">30</div>
            <div>dias de acesso completo</div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
        <svg className="w-6 h-6 text-[#D4AF37]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
