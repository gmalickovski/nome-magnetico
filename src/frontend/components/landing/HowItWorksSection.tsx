import React from 'react';
import { LandingSectionIntro, landingSectionShellClass } from './LandingSectionIntro';
import { useLandingSectionReveal } from './useLandingSectionReveal';

const STEP_ARROW = '#B8960E';

const steps = [
  {
    title: 'Frequência',
    body:
      'O nome de nascimento vira cinco números: Expressão, Destino, Motivação, Missão e Personalidade.',
  },
  {
    title: 'Bloqueios',
    body:
      'Os quatro triângulos, Vida, Pessoal, Social e Destino, mostram onde a sequência trava.',
  },
  {
    title: 'Arquétipo',
    body: 'O número também aponta como o nome é lido pelos outros.',
  },
  {
    title: 'Assinatura',
    body:
      'Com esse mapa saem as variações para assinar no social, no trabalho e no digital. A recomendação mantém a sua identidade e aproxima Expressão e Destino.',
  },
];

function StepArrow({ direction }: { direction: 'right' | 'down' }) {
  const horizontal = direction === 'right';
  return (
    <svg
      viewBox="0 0 24 24"
      className={horizontal ? 'h-4 w-6' : 'h-6 w-4'}
      aria-hidden="true"
      fill="none"
    >
      {horizontal ? (
        <path
          d="M2 12h18M14 6l6 6-6 6"
          stroke={STEP_ARROW}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M12 2v18M6 14l6 6 6-6"
          stroke={STEP_ARROW}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function HowItWorksSection() {
  const reveal = useLandingSectionReveal();

  return (
    <section
      id="como-funciona"
      ref={reveal.ref}
      className={`py-20 md:py-20 bg-[#1a1a1a] overflow-x-hidden ${reveal.className}`}
      aria-label="Como funciona"
    >
      <div className={landingSectionShellClass}>
        <LandingSectionIntro label="Como funciona" className="mb-8 md:mb-10" />

        <ol className="grid grid-cols-1 lg:grid-cols-4 gap-0 list-none m-0 p-0" role="list">
          {steps.map((step, index) => (
            <li key={step.title} className="relative min-w-0 lg:pr-8" role="listitem">
              <div className="flex items-center gap-3 min-w-0">
                <h3 className="font-cinzel text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-[#e5e2e1]">
                  {step.title}
                </h3>
                {index < steps.length - 1 && (
                  <span className="hidden lg:inline-flex shrink-0" aria-hidden="true">
                    <StepArrow direction="right" />
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                {step.body}
              </p>
              {index < steps.length - 1 && (
                <span className="lg:hidden flex justify-center py-6" aria-hidden="true">
                  <StepArrow direction="down" />
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
