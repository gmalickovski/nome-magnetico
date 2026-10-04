import React, { useMemo } from 'react';
import { LandingSectionIntro, landingSectionShellClass } from './LandingSectionIntro';
import { useScrollProgress } from './useScrollProgress';
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
    body: 'Informe seu nome completo de nascimento, data e objetivos pessoais no formulário inicial.',
    Figure: FormFigure,
  },
  {
    stepNumber: '02',
    title: 'Gere a análise',
    body: 'O algoritmo cabalístico cruza seus 4 triângulos, detecta bloqueios e avalia a compatibilidade energética.',
    Figure: GenerateFigure,
  },
  {
    stepNumber: '03',
    title: 'Escolha seu nome',
    body: 'Veja a assinatura mais indicada com score de harmonia e explore sugestões alternativas se desejar.',
    Figure: ChooseFigure,
  },
  {
    stepNumber: '04',
    title: 'Baixe o relatório',
    body: 'Receba seu PDF completo com o mapa numerológico, débitos kármicos e guia prático de ativação.',
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
        viewBox="0 0 24 24"
        className={horizontal ? 'h-5 w-8' : 'h-8 w-5'}
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
            d="M12 2v18M6 14l6 6 6-6"
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

export function HowItWorksSection() {
  const { ref, progress, reduceMotion } = useScrollProgress<HTMLElement>();

  // Progress metrics calculation for Desktop pinned scroll
  // p: 0.00 -> 0.15: Card 1 only, centered (offset 37.5%)
  // p: 0.15 -> 0.40: Card 2 enters, rail moves to 25.0%
  // p: 0.40 -> 0.65: Card 3 enters, rail moves to 12.5%
  // p: 0.65 -> 0.88: Card 4 enters, rail moves to 0.0%
  // p: 0.88 -> 1.00: All 4 cards pinned and locked in place
  const { railOffsetPercent, cardVisibility, arrowVisibility } = useMemo(() => {
    if (reduceMotion) {
      return {
        railOffsetPercent: 0,
        cardVisibility: [1, 1, 1, 1],
        arrowVisibility: [true, true, true],
      };
    }

    let offset = 37.5;
    const cardVis = [1, 0, 0, 0];
    const arrowVis = [false, false, false];

    if (progress <= 0.15) {
      offset = 37.5;
      cardVis[0] = 1;
    } else if (progress <= 0.4) {
      const t = (progress - 0.15) / 0.25;
      offset = 37.5 - t * 12.5;
      cardVis[1] = Math.min(1, t * 1.3);
      arrowVis[0] = t > 0.3;
    } else if (progress <= 0.65) {
      const t = (progress - 0.4) / 0.25;
      offset = 25.0 - t * 12.5;
      cardVis[1] = 1;
      arrowVis[0] = true;
      cardVis[2] = Math.min(1, t * 1.3);
      arrowVis[1] = t > 0.3;
    } else if (progress <= 0.88) {
      const t = (progress - 0.65) / 0.23;
      offset = 12.5 - t * 12.5;
      cardVis[1] = 1;
      cardVis[2] = 1;
      arrowVis[0] = true;
      arrowVis[1] = true;
      cardVis[3] = Math.min(1, t * 1.3);
      arrowVis[2] = t > 0.3;
    } else {
      offset = 0;
      cardVis[1] = 1;
      cardVis[2] = 1;
      cardVis[3] = 1;
      arrowVis[0] = true;
      arrowVis[1] = true;
      arrowVis[2] = true;
    }

    return {
      railOffsetPercent: offset,
      cardVisibility: cardVis,
      arrowVisibility: arrowVis,
    };
  }, [progress, reduceMotion]);

  return (
    <section
      id="como-funciona"
      ref={ref}
      className={`relative bg-[#111111] scroll-mt-20 ${
        reduceMotion ? 'py-20 lg:py-28' : 'lg:h-[340vh] py-20 lg:py-0'
      }`}
      aria-label="Como funciona"
    >
      {/* ── DESKTOP PINNED EXPERIENCE (lg: 1024px+) ────────────────────── */}
      <div className={`hidden lg:flex flex-col justify-center ${reduceMotion ? '' : 'sticky top-0 h-screen'} w-full overflow-x-clip`}>
        <div className={landingSectionShellClass}>
          <LandingSectionIntro
            label="Como funciona"
            title="Quatro passos até a sua nova assinatura"
            description="Entenda como a análise cabalística encontra a vibração ideal para harmonizar seu nome e destravar seu caminho."
            className="mb-12"
          />

          {/* Rail Track with dynamic horizontal offset */}
          <div className="relative w-full overflow-visible py-4">
            <div
              className="grid grid-cols-4 gap-6 xl:gap-8 transition-transform duration-300 ease-out will-change-transform"
              style={{
                transform: `translateX(${railOffsetPercent}%)`,
              }}
            >
              {steps.map((step, index) => {
                const Figure = step.Figure;
                const opacity = cardVisibility[index];
                const isVisible = opacity > 0.1;
                const hasArrow = index < steps.length - 1;
                const isArrowActive = hasArrow && arrowVisibility[index];

                return (
                  <div
                    key={step.stepNumber}
                    className="relative transition-all duration-700 ease-out"
                    style={{
                      opacity: opacity,
                      transform: isVisible
                        ? 'translateY(0px) scale(1)'
                        : 'translateY(24px) scale(0.95)',
                    }}
                  >
                    <article className="h-full rounded-2xl bg-[#161616]/80 backdrop-blur-md border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 p-6 xl:p-7 shadow-2xl shadow-black/60 transition-all duration-500 flex flex-col justify-between group">
                      <div>
                        {/* Header do Card: Número do Passo & SVG */}
                        <div className="flex items-center justify-between mb-5">
                          <span className="font-cinzel text-xs font-bold tracking-[0.2em] text-[#f2ca50] bg-[#f2ca50]/10 px-3 py-1 rounded-full border border-[#f2ca50]/20">
                            PASSO {step.stepNumber}
                          </span>
                          <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500">
                            <Figure active={isVisible} />
                          </div>
                        </div>

                        {/* Título & Descrição */}
                        <h3 className="font-cinzel text-lg xl:text-xl font-bold leading-tight text-[#e5e2e1] mb-3">
                          {step.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-gray-400 font-normal">
                          {step.body}
                        </p>
                      </div>

                      {/* Brilho decorativo sutil na base */}
                      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                        <span className="uppercase tracking-widest">Etapa {index + 1} de 4</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
                      </div>
                    </article>

                    {/* Seta direcional entre os cards (Desktop) */}
                    {hasArrow && (
                      <div
                        className="absolute top-1/2 -right-3.5 xl:-right-4.5 -translate-y-1/2 z-20 pointer-events-none"
                      >
                        <StepArrow direction="right" active={isArrowActive} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicador de progresso do scroll no desktop */}
          {!reduceMotion && (
            <div className="mt-8 flex justify-center items-center gap-3">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    cardVisibility[idx] >= 0.8
                      ? 'w-8 bg-[#f2ca50] shadow-[0_0_8px_rgba(242,202,80,0.6)]'
                      : 'w-2 bg-white/20'
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE & TABLET STACKED EXPERIENCE (< 1024px) ────────────── */}
      <div className="lg:hidden">
        <div className={landingSectionShellClass}>
          <LandingSectionIntro
            label="Como funciona"
            title="Quatro passos até a sua nova assinatura"
            description="Entenda como a análise cabalística encontra a vibração ideal para harmonizar seu nome."
            className="mb-10 text-center"
          />

          <ol className="flex flex-col gap-4 list-none m-0 p-0" role="list">
            {steps.map((step, index) => {
              const Figure = step.Figure;
              const isLast = index === steps.length - 1;

              return (
                <li key={step.stepNumber} className="relative flex flex-col items-center">
                  <article className="w-full rounded-2xl bg-[#161616]/90 border border-[#D4AF37]/35 p-6 shadow-xl shadow-black/60">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-cinzel text-xs font-bold tracking-[0.2em] text-[#f2ca50] bg-[#f2ca50]/10 px-3 py-1 rounded-full border border-[#f2ca50]/20">
                        PASSO {step.stepNumber}
                      </span>
                      <Figure active={true} />
                    </div>
                    <h3 className="font-cinzel text-lg font-bold leading-tight text-[#e5e2e1] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-400">
                      {step.body}
                    </p>
                  </article>

                  {/* Seta vertical no mobile */}
                  {!isLast && (
                    <div className="py-2">
                      <StepArrow direction="down" active={true} />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
