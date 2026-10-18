import React, { useRef, useState, useEffect } from 'react';
import {
  LandingSectionIntro,
  landingInteractiveCardClass,
  landingMockupFloatClass,
  landingSectionShellClass,
} from './LandingSectionIntro';
import { useLandingSectionReveal } from './useLandingSectionReveal';
import {
  FormFigure,
  GenerateFigure,
  ChooseFigure,
  DownloadFigure,
} from './HowItWorksFigures';

const steps = [
  {
    stepNumber: '01',
    title: 'Preencha seus dados',
    body: 'Informe seu nome completo de nascimento, data e onde pretende usar a assinatura.',
    Figure: FormFigure,
  },
  {
    stepNumber: '02',
    title: 'Veja sua nota hoje × potencial',
    body: 'O motor cabalístico calcula a nota atual do seu nome (0 a 100), avalia o Triângulo da Vida e mostra o potencial máximo de harmonia.',
    Figure: GenerateFigure,
  },
  {
    stepNumber: '03',
    title: 'Escolha no ranking (N5)',
    body: 'Compare sugestões com mudança mínima, forma encurtada e alternativa — cada uma explicando o que mudou e por quê.',
    Figure: ChooseFigure,
  },
  {
    stepNumber: '04',
    title: 'Baixe o relatório e o guia',
    body: 'Receba na hora seu PDF completo com mapa dos 5 números, leitura dos triângulos e guia prático de assinatura.',
    Figure: DownloadFigure,
  },
] as const;

function StepArrow({ direction, active = true }: { direction: 'right' | 'down'; active?: boolean }) {
  const horizontal = direction === 'right';
  return (
    <div
      className={`transition-all duration-700 ease-out flex items-center justify-center ${
        active ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
      }`}
      aria-hidden="true"
    >
      <svg
        viewBox={horizontal ? '0 0 24 24' : '0 0 24 36'}
        className={horizontal ? 'h-5 w-8' : 'h-9 w-6'}
        fill="none"
      >
        {horizontal ? (
          <path
            d="M2 12h18M14 6l6 6-6 6"
            stroke="#f2ca50"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_8px_rgba(242,202,80,0.5)]"
          />
        ) : (
          <path
            d="M12 2v24M5 19l7 7 7-7"
            stroke="#f2ca50"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_8px_rgba(242,202,80,0.5)]"
          />
        )}
      </svg>
    </div>
  );
}

/** Card de passo no layout mobile/tablet, com reveal suave ao rolar */
function MobileStepItem({
  step,
  index,
  isLast,
  reduceMotion,
}: {
  step: (typeof steps)[number];
  index: number;
  isLast: boolean;
  reduceMotion: boolean;
}) {
  const itemRef = useRef<HTMLLIElement>(null);
  const [revealed, setRevealed] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) return;

    const el = itemRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

  const Figure = step.Figure;

  return (
    <li
      ref={itemRef}
      className={`relative flex flex-col items-center w-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        reduceMotion || revealed
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-8 scale-95'
      }`}
    >
      <article className={`w-full max-w-lg mx-auto ${landingMockupFloatClass} p-6 sm:p-7 transition-all duration-500 flex flex-col justify-between`}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="font-cinzel text-xs font-bold tracking-[0.2em] text-[#f2ca50] bg-[#f2ca50]/10 px-3 py-1 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
              PASSO {step.stepNumber}
            </span>
            <div className="text-[#D4AF37]">
              <Figure active={reduceMotion || revealed} />
            </div>
          </div>

          <h3 className="font-cinzel text-lg sm:text-xl font-bold leading-snug text-[#e5e2e1] mb-2 text-balance">
            {step.title}
          </h3>
          <p className="text-sm leading-relaxed text-gray-400 font-normal text-pretty">
            {step.body}
          </p>
        </div>

        <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
          <span className="uppercase tracking-widest whitespace-nowrap">Etapa {index + 1} de 4</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
        </div>
      </article>

      {/* Seta vertical conectando ao próximo card */}
      {!isLast && (
        <div
          className={`py-3 transition-all duration-700 delay-150 ease-out ${
            reduceMotion || revealed
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-2 scale-75'
          }`}
          aria-hidden="true"
        >
          <StepArrow direction="down" active={reduceMotion || revealed} />
        </div>
      )}
    </li>
  );
}

export function HowItWorksSection() {
  const reveal = useLandingSectionReveal();
  const reduceMotion = reveal.reduceMotion;
  const isRevealed = reveal.revealed;

  return (
    <section
      id="como-funciona"
      ref={reveal.ref}
      className="relative bg-[#111111] scroll-mt-20 pt-20 pb-16 md:pt-24 md:pb-20 lg:pt-28 lg:pb-20 overflow-hidden w-full flex flex-col justify-center min-h-[auto] lg:min-h-[calc(100vh-4rem)]"
      aria-label="Como funciona"
    >
      {/* ── DESKTOP GRID EXPERIENCE (lg: 1024px+) ────────────────────── */}
      <div className="hidden lg:flex flex-col justify-center w-full min-w-0">
        <div className={landingSectionShellClass}>
          <LandingSectionIntro
            label="Como funciona"
            title="Quatro passos da sua nota hoje até a nova assinatura"
            description="Entenda como a análise cabalística compara a vibração atual do seu nome com o potencial máximo de harmonia."
            titleClassName="text-xl sm:text-2xl md:text-3xl lg:text-[2rem] xl:text-[2.25rem] font-bold uppercase tracking-wide max-w-4xl mx-auto leading-tight"
            descriptionClassName="max-w-[66ch] mx-auto text-sm sm:text-base mt-2 mb-6 xl:mb-8 text-pretty text-gray-400"
            className="text-center mb-6 xl:mb-8"
            revealed={isRevealed}
            reduceMotion={reduceMotion}
          />

          {/* 4-Card Responsive Grid with connecting arrows */}
          <div className="relative w-full">
            <div className="grid grid-cols-4 gap-4 xl:gap-6 items-stretch w-full">
              {steps.map((step, index) => {
                const Figure = step.Figure;
                const hasArrow = index < steps.length - 1;
                const delayMs = reduceMotion ? 0 : index * 100;

                return (
                  <div
                    key={step.stepNumber}
                    className="relative h-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      opacity: isRevealed ? 1 : 0,
                      transform: isRevealed
                        ? 'translateY(0px)'
                        : 'translateY(20px)',
                      transitionDelay: `${delayMs}ms`,
                    }}
                  >
                    <article className={`h-full ${landingInteractiveCardClass} p-5 xl:p-6 flex flex-col justify-between group`}>
                      <div>
                        {/* Header do Card: Número do Passo & SVG */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-cinzel text-[11px] font-bold tracking-[0.18em] text-[#f2ca50] bg-[#f2ca50]/10 px-2.5 py-1 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                            PASSO {step.stepNumber}
                          </span>
                          <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500">
                            <Figure active={isRevealed} />
                          </div>
                        </div>

                        {/* Título & Descrição */}
                        <h3 className="font-cinzel text-base xl:text-lg font-bold leading-snug text-[#e5e2e1] mb-2 text-balance">
                          {step.title}
                        </h3>
                        <p className="text-xs xl:text-sm leading-relaxed text-gray-400 font-normal text-pretty">
                          {step.body}
                        </p>
                      </div>

                      {/* Brilho decorativo sutil na base */}
                      <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                        <span className="uppercase tracking-widest whitespace-nowrap">Etapa {index + 1} de 4</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
                      </div>
                    </article>

                    {/* Seta direcional entre os cards (Desktop) */}
                    {hasArrow && (
                      <div
                        className="absolute top-1/2 -right-2.5 xl:-right-3.5 -translate-y-1/2 z-20 pointer-events-none"
                      >
                        <StepArrow direction="right" active={isRevealed} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE & TABLET STACKED EXPERIENCE (< 1024px) ────────────── */}
      <div className="lg:hidden w-full">
        <div className={landingSectionShellClass}>
          <LandingSectionIntro
            label="Como funciona"
            title="Quatro passos até a sua nova assinatura"
            description="Entenda como a análise cabalística encontra a vibração ideal para harmonizar seu nome."
            titleClassName="text-xl sm:text-2xl font-bold uppercase tracking-wide leading-snug"
            className="mb-8 text-center"
            revealed={isRevealed}
            reduceMotion={reduceMotion}
          />

          <ol className="flex flex-col gap-2 list-none m-0 p-0 w-full" role="list">
            {steps.map((step, index) => (
              <MobileStepItem
                key={step.stepNumber}
                step={step}
                index={index}
                isLast={index === steps.length - 1}
                reduceMotion={reduceMotion}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

