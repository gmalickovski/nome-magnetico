import React from 'react';
import { LandingSectionIntro, landingSectionShellClass } from './LandingSectionIntro';
import { useLandingSectionReveal } from './useLandingSectionReveal';
import {
  BlocksFigure,
  FrequencyFigure,
  RankingFigure,
  SignatureFigure,
} from './HowItWorksFigures';

const STEP_ARROW = '#B8960E';
const KIT_CARD =
  'h-full rounded-2xl bg-[#131313] border border-[#D4AF37]/35 p-6 min-w-0';

const steps = [
  {
    title: 'Frequência.',
    body: 'O nome de nascimento vira cinco números.',
    Figure: FrequencyFigure,
  },
  {
    title: 'Bloqueios.',
    body: 'Os quatro triângulos mostram onde a sequência trava.',
    Figure: BlocksFigure,
  },
  {
    title: 'Ranking.',
    body: 'As variações ganham score e a indicada fica marcada.',
    Figure: RankingFigure,
  },
  {
    title: 'Assinatura.',
    body: 'Você recebe a assinatura para usar e o PDF.',
    Figure: SignatureFigure,
  },
] as const;

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
      className={`py-20 md:py-20 bg-[#1a1a1a] overflow-x-hidden scroll-mt-28 ${reveal.className}`}
      aria-label="Como funciona"
    >
      <div className={landingSectionShellClass}>
        <LandingSectionIntro label="Como funciona" className="mb-8 md:mb-10" />

        <ol className="grid grid-cols-1 lg:grid-cols-4 gap-0 lg:gap-8 list-none m-0 p-0" role="list">
          {steps.map((step, index) => {
            const Figure = step.Figure;
            const last = index === steps.length - 1;
            return (
              <li key={step.title} className="relative min-w-0" role="listitem">
                <article className={KIT_CARD}>
                  <div className="mb-6">
                    <Figure />
                  </div>
                  <h3 className="font-cinzel text-lg md:text-xl font-bold leading-tight text-[#e5e2e1]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-400">{step.body}</p>
                </article>
                {!last && (
                  <>
                    <span
                      className="hidden lg:flex absolute top-1/2 -right-6 -translate-y-1/2 z-10"
                      aria-hidden="true"
                    >
                      <StepArrow direction="right" />
                    </span>
                    <span className="lg:hidden flex justify-center py-6" aria-hidden="true">
                      <StepArrow direction="down" />
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
