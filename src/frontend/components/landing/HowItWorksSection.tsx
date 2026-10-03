import React from 'react';
import { LandingSectionIntro, landingSectionShellClass } from './LandingSectionIntro';
import { useLandingSectionReveal } from './useLandingSectionReveal';

const steps = [
  {
    title: 'Frequência.',
    body:
      'O nome de nascimento vira cinco números: Expressão, Destino, Motivação, Missão e Personalidade.',
  },
  {
    title: 'Bloqueios.',
    body:
      'Os quatro triângulos, Vida, Pessoal, Social e Destino, mostram onde a sequência trava.',
  },
  {
    title: 'Arquétipo.',
    body: 'O número também aponta como o nome é lido pelos outros.',
  },
  {
    title: 'Assinatura.',
    body:
      'Com esse mapa saem as variações para assinar no social, no trabalho e no digital. A recomendação mantém a sua identidade e aproxima Expressão e Destino.',
  },
];

export function HowItWorksSection() {
  const reveal = useLandingSectionReveal();

  return (
    <section
      id="como-funciona"
      ref={reveal.ref}
      className={`py-20 md:py-32 bg-[#1a1a1a] overflow-x-hidden ${reveal.className}`}
      aria-label="Como funciona"
    >
      <div className={landingSectionShellClass}>
        <LandingSectionIntro label="Como funciona" className="mb-10 md:mb-12" />

        <ol className="space-y-8 md:space-y-10 max-w-prose lg:max-w-2xl" role="list">
          {steps.map((step, index) => (
            <li key={step.title} className="min-w-0" role="listitem">
              <p className="text-sm md:text-base leading-relaxed text-gray-400">
                <span className="text-[#e5e2e1] font-medium">
                  {index + 1}. {step.title}
                </span>{' '}
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
