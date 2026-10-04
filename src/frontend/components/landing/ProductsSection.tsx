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
      className={`relative py-20 md:py-20 bg-[#111111] overflow-x-hidden ${reveal.className}`}
    >
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-0 right-0 md:right-[10%] w-[min(100%,280px)] h-[280px] md:w-[420px] md:h-[420px] bg-[#D4AF37]/5 rounded-full blur-[80px] md:blur-[120px]" />
      </div>

      <div className={`relative ${landingSectionShellClass}`}>
        <div className={`grid grid-cols-1 lg:grid-cols-2 ${landingSectionStackGapClass} items-center`}>
          <div className="min-w-0 [&_h2]:!text-3xl [&_h2]:md:!text-4xl [&_h2]:lg:!text-5xl [&_h2]:!leading-tight">
            <LandingSectionIntro
              align="left"
              label="Produto"
              title="Sua assinatura de nome social."
            />
            <p className="text-[#e5e2e1] text-sm md:text-base leading-relaxed mt-4 mb-3 max-w-prose mx-auto lg:mx-0">
              Do nome de nascimento à assinatura que você usa no dia a dia.
            </p>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-prose mx-auto lg:mx-0">
              A gente compara o nome de nascimento com variações de nome social. O cálculo mostra
              quais ficam mais alinhadas ao Destino e quais ainda carregam o bloqueio do nome
              original. No fim, uma assinatura recomendada e as variações para testar, com score de
              0 a 100.
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-[#D4AF37] p-1">
            <ProductResultFrame />
          </div>
        </div>
      </div>
    </section>
  );
}
