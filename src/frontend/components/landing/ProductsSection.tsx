import React from 'react';
import {
  LandingSectionIntro,
  landingSectionShellClass,
  landingSectionStackGapClass,
} from './LandingSectionIntro';
import { useLandingSectionReveal } from './useLandingSectionReveal';
import { ProductResultFrame } from './ProductResultFrame';

export function ProductsSection() {
  const reveal = useLandingSectionReveal();

  return (
    <section
      id="produtos"
      ref={reveal.ref}
      className={`relative py-20 md:py-20 bg-[#111111] overflow-x-hidden scroll-mt-28 ${reveal.className}`}
    >
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-0 right-0 md:right-[10%] w-[min(100%,280px)] h-[280px] md:w-[420px] md:h-[420px] bg-[#D4AF37]/5 rounded-full blur-[80px] md:blur-[120px]" />
      </div>

      <div className={`relative ${landingSectionShellClass}`}>
        <div className={`grid grid-cols-1 lg:grid-cols-2 ${landingSectionStackGapClass} items-start`}>
          <div className="min-w-0 [&_h2]:!text-3xl [&_h2]:md:!text-4xl [&_h2]:lg:!text-5xl [&_h2]:!leading-tight">
            <LandingSectionIntro
              align="left"
              label="Produto"
              title="Sua assinatura de nome social."
            />
            <p className="text-[#e5e2e1] text-sm md:text-base leading-relaxed mt-4 mb-6 max-w-prose mx-auto lg:mx-0">
              Do nome de nascimento à assinatura que você usa no dia a dia — com acesso imediato
              e análise na hora.
            </p>

            <div className="space-y-6 max-w-prose mx-auto lg:mx-0">
              <div>
                <p className="font-cinzel text-[10px] sm:text-xs uppercase tracking-[0.15em] text-[#D4AF37]/80 mb-2">
                  A Harmonização
                </p>
                <h3 className="font-cinzel text-lg sm:text-xl font-bold text-[#e5e2e1] mb-2">
                  Seu nome pode estar travando o que você quer realizar.
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  Cada letra carrega uma frequência. Quando o nome de nascimento acumula bloqueios,
                  a vibração trava — e isso aparece no score de 0 a 100. A Harmonização cria um
                  escudo: uma variação de nome social alinhada ao seu Destino, sem apagar quem você
                  é. Você vê o antes e o depois lado a lado — e sente a diferença no número.
                </p>
              </div>

              <div>
                <p className="font-cinzel text-[10px] sm:text-xs uppercase tracking-[0.15em] text-[#D4AF37]/80 mb-2">
                  As Sugestões
                </p>
                <h3 className="font-cinzel text-lg sm:text-xl font-bold text-[#e5e2e1] mb-2">
                  Não é um nome imposto. É um ranking para você escolher.
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  O sistema gera sugestões e também analisa as variações que você indicar. Cada
                  card mostra score, compatibilidade Expressão × Destino, os 5 números e se ainda
                  há bloqueios. Compare, escolha a assinatura que ressoa — e rode a análise completa
                  quando quiser. Self-service, na hora.
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-[#D4AF37] p-1">
            <ProductResultFrame />
          </div>
        </div>
      </div>
    </section>
  );
}
