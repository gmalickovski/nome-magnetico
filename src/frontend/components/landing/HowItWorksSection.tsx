import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  LandingSectionIntro,
  landingInteractiveCardClass,
  landingMockupFloatClass,
  landingSectionShellClass,
  landingSectionSpacingClass,
} from './LandingSectionIntro';
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

          <h3 className="font-cinzel text-lg sm:text-xl font-bold leading-snug text-white mb-2 text-balance">
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
  const { ref, progress, reduceMotion } = useScrollProgress<HTMLElement>();

  // Progress metrics calculation for Desktop pinned scroll with two-phase choreography:
  // Phase 1 (p: 0.00 -> 0.22): Intro (Header + Title + Desc) smoothly slides up and fades away into top/hero edge.
  // Phase 2 (p: 0.22 -> 1.00): Only cards remain, perfectly centered in viewport, sequentially entering and shifting.
  const {
    introOpacity,
    introTranslateY,
    introMaxHeight,
    introMarginBottom,
    railOffsetPercent,
    cardVisibility,
    arrowVisibility,
  } = useMemo(() => {
    if (reduceMotion) {
      return {
        introOpacity: 1,
        introTranslateY: 0,
        introMaxHeight: 300,
        introMarginBottom: 48,
        railOffsetPercent: 0,
        cardVisibility: [1, 1, 1, 1],
        arrowVisibility: [true, true, true],
      };
    }

    // Phase 1: Intro exit (p: 0.00 -> 0.22)
    let introOp = 1;
    let introY = 0;
    let introH = 260;
    let introMB = 40;

    if (progress <= 0.04) {
      introOp = 1;
      introY = 0;
      introH = 260;
      introMB = 40;
    } else if (progress <= 0.22) {
      const t = (progress - 0.04) / 0.18;
      introOp = Math.max(0, 1 - t * 1.15);
      introY = -t * 60;
      introH = Math.max(0, 260 * (1 - t));
      introMB = Math.max(0, 40 * (1 - t));
    } else {
      introOp = 0;
      introY = -60;
      introH = 0;
      introMB = 0;
    }

    // Phase 2: Sequential Card Reveal & Rail Shift
    let offset = 37.5;
    const cardVis = [1, 0, 0, 0];
    const arrowVis = [false, false, false];

    if (progress <= 0.22) {
      offset = 37.5;
      cardVis[0] = 1;
    } else if (progress <= 0.46) {
      const t = (progress - 0.22) / 0.24;
      offset = 37.5 - t * 12.5;
      cardVis[0] = 1;
      cardVis[1] = Math.min(1, t * 1.4);
      arrowVis[0] = t > 0.2;
    } else if (progress <= 0.70) {
      const t = (progress - 0.46) / 0.24;
      offset = 25.0 - t * 12.5;
      cardVis[0] = 1;
      cardVis[1] = 1;
      arrowVis[0] = true;
      cardVis[2] = Math.min(1, t * 1.4);
      arrowVis[1] = t > 0.2;
    } else if (progress <= 0.90) {
      const t = (progress - 0.70) / 0.20;
      offset = 12.5 - t * 12.5;
      cardVis[0] = 1;
      cardVis[1] = 1;
      cardVis[2] = 1;
      arrowVis[0] = true;
      arrowVis[1] = true;
      cardVis[3] = Math.min(1, t * 1.4);
      arrowVis[2] = t > 0.2;
    } else {
      offset = 0;
      cardVis[0] = 1;
      cardVis[1] = 1;
      cardVis[2] = 1;
      cardVis[3] = 1;
      arrowVis[0] = true;
      arrowVis[1] = true;
      arrowVis[2] = true;
    }

    return {
      introOpacity: introOp,
      introTranslateY: introY,
      introMaxHeight: introH,
      introMarginBottom: introMB,
      railOffsetPercent: offset,
      cardVisibility: cardVis,
      arrowVisibility: arrowVis,
    };
  }, [progress, reduceMotion]);

  return (
    <section
      id="como-funciona"
      ref={ref}
      className={`relative bg-[#111111] scroll-mt-24 lg:scroll-mt-28 ${
        reduceMotion
          ? landingSectionSpacingClass
          : 'lg:h-[350vh] py-20 md:py-24 lg:py-0'
      }`}
      aria-label="Como funciona"
    >
      {/* ── DESKTOP PINNED EXPERIENCE (lg: 1024px+) ────────────────────── */}
      <div
        className={`hidden lg:flex flex-col justify-center items-center ${
          reduceMotion ? 'py-20 lg:py-28' : 'sticky top-0 h-screen pt-20 lg:pt-24 pb-12 lg:pb-16'
        } w-full overflow-x-clip`}
      >
        <div className={`${landingSectionShellClass} flex flex-col justify-center items-center h-full min-h-0`}>
          {/* Section Intro: slides up and fades away as scroll progresses, leaving cards centered */}
          <div
            className="w-full text-center transition-all duration-300 ease-out will-change-transform"
            style={{
              opacity: introOpacity,
              transform: `translateY(${introTranslateY}px)`,
              maxHeight: `${introMaxHeight}px`,
              marginBottom: `${introMarginBottom}px`,
              overflow: 'hidden',
              pointerEvents: introOpacity > 0.1 ? 'auto' : 'none',
            }}
          >
            <LandingSectionIntro
              label="Como funciona"
              title="Quatro passos da sua nota hoje até a nova assinatura"
              description="Entenda como a análise cabalística compara a vibração atual do seu nome com o potencial máximo de harmonia."
              titleClassName="text-xl sm:text-2xl md:text-3xl lg:text-[2.25rem] xl:text-[2.5rem] font-bold uppercase tracking-wide max-w-4xl mx-auto leading-[1.3] lg:leading-[1.35] text-white text-balance"
              descriptionClassName="max-w-[64ch] mx-auto text-sm sm:text-base mt-4 md:mt-5 leading-relaxed text-pretty text-gray-400"
              className="text-center"
              revealed={true}
              reduceMotion={reduceMotion}
            />
          </div>

          {/* Rail Track with dynamic horizontal offset (centered in viewport) */}
          <div className="relative w-full overflow-visible py-2">
            <div
              className="grid grid-cols-4 gap-6 xl:gap-8 items-stretch transition-transform duration-300 ease-out will-change-transform"
              style={{
                transform: `translateX(${railOffsetPercent}%)`,
              }}
            >
              {steps.map((step, index) => {
                const Figure = step.Figure;
                const opacity = cardVisibility[index];
                const isVisible = opacity > 0.05;
                const hasArrow = index < steps.length - 1;
                const isArrowActive = hasArrow && arrowVisibility[index];

                return (
                  <div
                    key={step.stepNumber}
                    className="relative h-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      opacity: opacity,
                      transform: isVisible
                        ? 'translateY(0px) scale(1)'
                        : 'translateY(24px) scale(0.95)',
                      pointerEvents: isVisible ? 'auto' : 'none',
                    }}
                  >
                    <article className={`h-full ${landingInteractiveCardClass} p-5 sm:p-6 lg:p-6 xl:p-7 flex flex-col justify-between group`}>
                      <div>
                        {/* Header do Card: Número do Passo & SVG */}
                        <div className="flex items-center justify-between mb-4 xl:mb-5">
                          <span className="font-cinzel text-xs font-bold tracking-[0.2em] text-[#f2ca50] bg-[#f2ca50]/10 px-3 py-1 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                            PASSO {step.stepNumber}
                          </span>
                          <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500">
                            <Figure active={isVisible} />
                          </div>
                        </div>

                        {/* Título & Descrição */}
                        <h3 className="font-cinzel text-base sm:text-lg xl:text-xl font-bold leading-snug text-white mb-2.5 text-balance">
                          {step.title}
                        </h3>
                        <p className="text-xs sm:text-sm leading-relaxed text-gray-400 font-normal text-pretty">
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
            title="Quatro passos da sua nota hoje até a nova assinatura"
            description="Entenda como a análise cabalística encontra a vibração ideal para harmonizar seu nome."
            titleClassName="text-xl sm:text-2xl font-bold uppercase tracking-wide leading-[1.3] text-white text-balance"
            descriptionClassName="max-w-[54ch] mx-auto text-sm mt-3 leading-relaxed text-pretty text-gray-400"
            className="mb-8 text-center"
            revealed={true}
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
