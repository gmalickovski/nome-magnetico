import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  LandingSectionIntro,
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
        className={horizontal ? 'h-5 w-8' : 'h-5 w-3.5 sm:h-6 sm:w-4'}
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

function MobileStepItem({
  step,
  index,
  isLast,
  isExpanded,
  showArrow,
}: {
  step: (typeof steps)[number];
  index: number;
  isLast: boolean;
  isExpanded: boolean;
  showArrow: boolean;
}) {
  const Figure = step.Figure;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Container expansível do Card com grid 0fr -> 1fr */}
      <div
        className={`w-full grid transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isExpanded
            ? 'grid-rows-[1fr] opacity-100 translate-y-0 scale-100'
            : 'grid-rows-[0fr] opacity-0 translate-y-6 scale-95 pointer-events-none'
        }`}
      >
        <div className={`w-full transition-[padding] duration-500 ${isExpanded ? 'overflow-visible py-1 px-1' : 'overflow-hidden py-0 px-0'}`}>
          <article
            className={`w-full ${landingMockupFloatClass} p-4 sm:p-5 flex flex-col justify-between min-h-[155px] sm:min-h-[170px] group`}
          >
            <div>
              {/* Header do Card: Número do Passo & SVG */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-cinzel text-xs font-bold tracking-[0.2em] text-[#f2ca50] bg-[#f2ca50]/10 px-3 py-1 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                  PASSO {step.stepNumber}
                </span>
                <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500 scale-90 origin-right">
                  <Figure active={isExpanded} />
                </div>
              </div>

              {/* Título & Descrição */}
              <h3 className="font-cinzel text-base sm:text-lg font-bold leading-snug text-white mb-1.5 text-balance">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-gray-400 font-normal text-pretty">
                {step.body}
              </p>
            </div>

            {/* Rodapé do Card */}
            <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
              <span className="uppercase tracking-widest whitespace-nowrap">Etapa {index + 1} de 4</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
            </div>
          </article>
        </div>
      </div>

      {/* Seta para baixo apontando para o próximo card (aparece somente quando o próximo card entra) */}
      {!isLast && (
        <div
          className={`w-full grid transition-all duration-500 ease-out ${
            showArrow
              ? 'grid-rows-[1fr] opacity-100 py-1 sm:py-1.5'
              : 'grid-rows-[0fr] opacity-0 py-0 pointer-events-none'
          }`}
          aria-hidden="true"
        >
          <div className="overflow-hidden flex justify-center items-center pointer-events-none">
            <StepArrow direction="down" active={showArrow} />
          </div>
        </div>
      )}
    </div>
  );
}

export function HowItWorksSection() {
  const { ref, progress, reduceMotion } = useScrollProgress<HTMLElement>();
  const introRef = useRef<HTMLDivElement>(null);

  // Controle de reveal progressivo / reverso para telas mobile e tablet (< 1024px)
  const [revealedCount, setRevealedCount] = useState(reduceMotion ? 4 : 0);

  useEffect(() => {
    if (reduceMotion) {
      setRevealedCount(4);
      return;
    }

    let rafId = 0;

    const handleScroll = () => {
      rafId = 0;
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;

      // Ponto de gatilho: quando a seção passa do centro da tela
      const screenCenter = vh * 0.50;
      const scrollPastCenter = screenCenter - rect.top;

      // Se ainda não passou do centro da tela: seção compacta contendo apenas título e texto
      if (scrollPastCenter < 30) {
        setRevealedCount(0);
      } else if (scrollPastCenter < 170) {
        setRevealedCount(1);
      } else if (scrollPastCenter < 310) {
        setRevealedCount(2);
      } else if (scrollPastCenter < 450) {
        setRevealedCount(3);
      } else {
        setRevealedCount(4);
      }
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(handleScroll);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [reduceMotion]);

  // ── DESKTOP CHOREOGRAPHY (lg: 1024px+ — 100% INTACTO) ──────────────────────
  const {
    introOpacity,
    introTranslateY,
    cardEntryY,
    railOffsetPercent,
    cardVisibility,
    arrowVisibility,
    activeStepIndex,
  } = useMemo(() => {
    if (reduceMotion) {
      return {
        introOpacity: 1,
        introTranslateY: 0,
        cardEntryY: 0,
        railOffsetPercent: 0,
        cardVisibility: [1, 1, 1, 1],
        arrowVisibility: [true, true, true],
        activeStepIndex: 0,
      };
    }

    // FASE 1: DESKTOP
    const INTRO_PHASE_END = 0.18;
    let introOp = 1;
    let introY = 0;
    let cardY = 0;

    if (progress <= 0) {
      introOp = 1;
      introY = 0;
      cardY = 150;
    } else if (progress < INTRO_PHASE_END) {
      const t = progress / INTRO_PHASE_END;
      const rollT = Math.min(1, t / 0.50);
      const rollEase = rollT * rollT * (3 - 2 * rollT);
      introY = -rollEase * 18;

      const fadeT = Math.min(1, t / 0.68);
      const fadeEase = fadeT * fadeT * (3 - 2 * fadeT);
      introOp = Math.max(0, 1 - fadeEase);

      const cardEase = t * t * (3 - 2 * t);
      cardY = (1 - cardEase) * 150;
    } else {
      introOp = 0;
      introY = -18;
      cardY = 0;
    }

    // FASE 2: DESKTOP RAIL (0.18 -> 0.78)
    const REVEAL_PHASE_END = 0.78;
    const revProg = progress <= INTRO_PHASE_END
      ? 0
      : Math.min(1, (progress - INTRO_PHASE_END) / (REVEAL_PHASE_END - INTRO_PHASE_END));

    const currentActiveStep = revProg < 0.28 ? 0 : revProg < 0.58 ? 1 : revProg < 0.85 ? 2 : 3;

    const cardVis = [1, 0, 0, 0];
    const arrowVis = [false, false, false];
    let offset = 37.5;

    if (revProg < 0.05) {
      offset = 37.5;
    } else if (revProg < 0.35) {
      const t = (revProg - 0.05) / 0.30;
      const ease = t * t * (3 - 2 * t);
      offset = 37.5 - ease * 12.5;
      cardVis[1] = ease;
      arrowVis[0] = t > 0.25;
    } else if (revProg < 0.68) {
      cardVis[1] = 1;
      arrowVis[0] = true;
      const t = (revProg - 0.35) / 0.33;
      const ease = t * t * (3 - 2 * t);
      offset = 25.0 - ease * 12.5;
      cardVis[2] = ease;
      arrowVis[1] = t > 0.25;
    } else {
      cardVis[1] = 1;
      arrowVis[0] = true;
      cardVis[2] = 1;
      arrowVis[1] = true;
      const t = Math.min(1, (revProg - 0.68) / 0.32);
      const ease = t * t * (3 - 2 * t);
      offset = 12.5 - ease * 12.5;
      cardVis[3] = ease;
      arrowVis[2] = t > 0.25;
    }

    return {
      introOpacity: introOp,
      introTranslateY: introY,
      cardEntryY: cardY,
      railOffsetPercent: offset,
      cardVisibility: cardVis,
      arrowVisibility: arrowVis,
      activeStepIndex: currentActiveStep,
    };
  }, [progress, reduceMotion]);

  return (
    <section
      id="como-funciona"
      ref={ref}
      className="relative z-10 bg-[#111111] scroll-mt-24 lg:scroll-mt-28 overflow-x-clip"
      aria-label="Como funciona"
    >
      {/* ── 1. DESKTOP VIEW (lg: 1024px+ — 100% INTACTO COM SCROLL PINNING) ────── */}
      <div
        className={`hidden lg:block w-full ${
          reduceMotion
            ? landingSectionSpacingClass
            : 'h-[360vh]'
        }`}
      >
        <div
          data-sticky-container
          className={`w-full flex flex-col ${
            reduceMotion
              ? 'py-20 lg:py-28'
              : 'sticky top-0 h-screen min-h-screen pt-[80px] pb-6 overflow-hidden'
          }`}
        >
          <div className="flex-1 relative flex flex-col justify-center items-center w-full min-h-0">
            <div className={`${landingSectionShellClass} relative flex flex-col items-center justify-center w-full h-full min-h-0`}>

              {/* TÍTULO DESKTOP */}
              <div
                className="w-full text-center absolute top-2 sm:top-3 lg:top-4 left-0 right-0 z-10 will-change-[transform,opacity] pointer-events-none px-4"
                style={{
                  opacity: introOpacity,
                  transform: `translateY(${introTranslateY}px)`,
                  visibility: introOpacity <= 0 ? 'hidden' : 'visible',
                }}
              >
                <div ref={introRef} className="w-full text-center max-w-4xl mx-auto">
                  <LandingSectionIntro
                    label="Como funciona"
                    title={
                      <>
                        Quatro Passos<br />da Sua Nota Hoje até a Nova Assinatura
                      </>
                    }
                    description="Entenda como a análise cabalística compara a vibração atual do seu nome com o potencial máximo de harmonia."
                    titleClassName="text-2xl sm:text-2xl md:text-3xl lg:text-[2.25rem] xl:text-[2.5rem] font-bold max-w-4xl mx-auto leading-[1.25] lg:leading-[1.26] text-white text-balance"
                    descriptionClassName="max-w-[58ch] mx-auto text-sm sm:text-base mt-4 sm:mt-5 leading-relaxed text-pretty text-gray-400"
                    className="text-center"
                    revealed={true}
                    reduceMotion={reduceMotion}
                  />
                </div>
              </div>

              {/* CARDS CONTAINER DESKTOP */}
              <div
                className="w-full flex flex-col items-center justify-center my-auto z-20 will-change-transform"
                style={{
                  transform: `translateY(${cardEntryY}px)`,
                }}
              >
                <div className="relative w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto overflow-visible py-2">
                  <div
                    className="grid grid-cols-4 gap-6 xl:gap-8 items-stretch will-change-transform min-w-[1020px] max-w-[1440px] mx-auto"
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
                          className="relative h-full will-change-[transform,opacity] min-w-[240px] max-w-[340px]"
                          style={{
                            opacity: opacity,
                            transform: `translateY(${(1 - Math.min(1, opacity)) * 20}px) scale(${0.96 + Math.min(1, opacity) * 0.04})`,
                            pointerEvents: isVisible ? 'auto' : 'none',
                          }}
                        >
                          <article className={`h-full ${landingMockupFloatClass} p-5 sm:p-6 lg:p-6 xl:p-7 flex flex-col justify-between group`}>
                            <div>
                              <div className="flex items-center justify-between mb-4 xl:mb-5">
                                <span className="font-cinzel text-xs font-bold tracking-[0.2em] text-[#f2ca50] bg-[#f2ca50]/10 px-3 py-1 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                                  PASSO {step.stepNumber}
                                </span>
                                <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500">
                                  <Figure active={isVisible} />
                                </div>
                              </div>

                              <h3 className="font-cinzel text-base sm:text-lg xl:text-xl font-bold leading-snug text-white mb-2.5 text-balance">
                                {step.title}
                              </h3>
                              <p className="text-xs sm:text-sm leading-relaxed text-gray-400 font-normal text-pretty">
                                {step.body}
                              </p>
                            </div>

                            <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                              <span className="uppercase tracking-widest whitespace-nowrap">Etapa {index + 1} de 4</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
                            </div>
                          </article>

                          {hasArrow && (
                            <div className="absolute top-1/2 -right-3.5 xl:-right-4.5 -translate-y-1/2 z-20 pointer-events-none">
                              <StepArrow direction="right" active={isArrowActive} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {!reduceMotion && (
                  <div className="mt-3.5 sm:mt-4 lg:mt-5 flex justify-center items-center gap-2.5">
                    {steps.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          activeStepIndex === idx
                            ? 'w-7 sm:w-8 bg-[#f2ca50] shadow-[0_0_8px_rgba(242,202,80,0.6)]'
                            : 'w-2 bg-white/20'
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. MOBILE & TABLET VIEW (< lg: — TÍTULO ESTÁTICO NO TOPO, CARDS EXPANDEM NA ROLAGEM) ─ */}
      <div
        className={`lg:hidden w-full flex flex-col items-center py-12 sm:py-16 md:py-20 ${landingSectionShellClass}`}
      >
        {/* TÍTULO DA SEÇÃO (Estático, fixo próximo ao topo respeitando o padding padrão) */}
        <div className="w-full text-center">
          <div className="w-full max-w-xl md:max-w-2xl mx-auto">
            <LandingSectionIntro
              label="Como funciona"
              title="Quatro Passos da Sua Nota Hoje até a Nova Assinatura"
              description="Entenda como a análise cabalística compara a vibração atual do seu nome com o potencial máximo de harmonia."
              titleClassName="text-2xl sm:text-[1.65rem] md:text-3xl font-bold max-w-xl md:max-w-2xl mx-auto leading-[1.15] text-white text-balance"
              descriptionClassName="max-w-[48ch] md:max-w-[56ch] mx-auto text-xs sm:text-sm md:text-base mt-4 sm:mt-5 leading-relaxed text-pretty text-gray-400"
              className="text-center"
              revealed={true}
              reduceMotion={reduceMotion}
            />
          </div>
        </div>

        {/* CONTAINER DOS CARDS: margin-top transiciona quando os cards entram */}
        <div
          className={`w-full flex flex-col items-center transition-[margin] duration-500 ease-out ${
            revealedCount > 0 ? 'mt-8 sm:mt-10 md:mt-12' : 'mt-0'
          }`}
        >
          {/* 2A. SMARTPHONE: CARDS ENTRAM NA ORDEM UM A UM E EXPANDEM O CONTAINER */}
          <div className="md:hidden flex flex-col items-center w-full max-w-xl mx-auto">
            {steps.map((step, idx) => {
              const isExpanded = revealedCount >= idx + 1;
              const showArrow = revealedCount >= idx + 2;
              return (
                <MobileStepItem
                  key={step.stepNumber}
                  step={step}
                  index={idx}
                  isLast={idx === steps.length - 1}
                  isExpanded={isExpanded}
                  showArrow={showArrow}
                />
              );
            })}
          </div>

          {/* 2B. TABLET: LINHA 1 (01+02) E LINHA 2 (03+04) EXPANDEM PROGRESSIVAMENTE EM GRID 2x2 */}
          <div
            className={`hidden md:flex lg:hidden flex-col w-full max-w-3xl md:max-w-4xl mx-auto transition-[gap] duration-500 ${
              revealedCount >= 3 ? 'gap-7' : 'gap-0'
            }`}
          >
            {/* LINHA 1: Cards 01 e 02 */}
            <div
              className={`w-full grid transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                revealedCount >= 1
                  ? 'grid-rows-[1fr] opacity-100 translate-y-0 scale-100'
                  : 'grid-rows-[0fr] opacity-0 translate-y-6 scale-95 pointer-events-none'
              }`}
            >
              <div
                className={`w-full transition-[padding] duration-500 ${
                  revealedCount >= 1 ? 'overflow-visible pt-1.5 px-1 pb-0' : 'overflow-hidden py-0 px-0'
                }`}
              >
                <div className="relative grid grid-cols-2 gap-7 w-full items-stretch">
                  {/* Card 01 (Esquerda) */}
                  <article
                    className={`h-full ${landingMockupFloatClass} p-4 md:p-5 flex flex-col justify-between min-h-[155px] group transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      revealedCount >= 1
                        ? 'opacity-100 translate-x-0 scale-100 delay-0'
                        : 'opacity-0 -translate-x-4 scale-95 pointer-events-none'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="font-cinzel text-[11px] font-bold tracking-[0.18em] text-[#f2ca50] bg-[#f2ca50]/10 px-2.5 py-0.5 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                          PASSO {steps[0].stepNumber}
                        </span>
                        <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500 scale-85 origin-right">
                          <FormFigure active={revealedCount >= 1} />
                        </div>
                      </div>
                      <h3 className="font-cinzel text-sm md:text-base font-bold leading-snug text-white mb-1 text-balance">
                        {steps[0].title}
                      </h3>
                      <p className="text-xs md:text-[13px] leading-relaxed text-gray-400 font-normal text-pretty line-clamp-3">
                        {steps[0].body}
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                      <span className="uppercase tracking-widest whitespace-nowrap">Etapa 1 de 4</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
                    </div>
                  </article>

                  {/* Card 02 (Direita — delay para surgir da esquerda para direita) */}
                  <article
                    className={`h-full ${landingMockupFloatClass} p-4 md:p-5 flex flex-col justify-between min-h-[155px] group transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      revealedCount >= 2
                        ? 'opacity-100 translate-x-0 scale-100 delay-150'
                        : 'opacity-0 -translate-x-4 scale-95 pointer-events-none'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="font-cinzel text-[11px] font-bold tracking-[0.18em] text-[#f2ca50] bg-[#f2ca50]/10 px-2.5 py-0.5 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                          PASSO {steps[1].stepNumber}
                        </span>
                        <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500 scale-85 origin-right">
                          <GenerateFigure active={revealedCount >= 2} />
                        </div>
                      </div>
                      <h3 className="font-cinzel text-sm md:text-base font-bold leading-snug text-white mb-1 text-balance">
                        {steps[1].title}
                      </h3>
                      <p className="text-xs md:text-[13px] leading-relaxed text-gray-400 font-normal text-pretty line-clamp-3">
                        {steps[1].body}
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                      <span className="uppercase tracking-widest whitespace-nowrap">Etapa 2 de 4</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
                    </div>
                  </article>

                  {/* Seta horizontal na linha 1 */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <StepArrow direction="right" active={revealedCount >= 2} />
                  </div>
                </div>
              </div>
            </div>

            {/* LINHA 2: Cards 03 e 04 */}
            <div
              className={`w-full grid transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                revealedCount >= 3
                  ? 'grid-rows-[1fr] opacity-100 translate-y-0 scale-100'
                  : 'grid-rows-[0fr] opacity-0 translate-y-6 scale-95 pointer-events-none'
              }`}
            >
              <div
                className={`w-full transition-[padding] duration-500 ${
                  revealedCount >= 3 ? 'overflow-visible pt-0 px-1 pb-1.5' : 'overflow-hidden py-0 px-0'
                }`}
              >
                <div className="relative grid grid-cols-2 gap-7 w-full items-stretch">
                  {/* Card 03 (Esquerda) */}
                  <article
                    className={`h-full ${landingMockupFloatClass} p-4 md:p-5 flex flex-col justify-between min-h-[155px] group transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      revealedCount >= 3
                        ? 'opacity-100 translate-x-0 scale-100 delay-0'
                        : 'opacity-0 -translate-x-4 scale-95 pointer-events-none'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="font-cinzel text-[11px] font-bold tracking-[0.18em] text-[#f2ca50] bg-[#f2ca50]/10 px-2.5 py-0.5 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                          PASSO {steps[2].stepNumber}
                        </span>
                        <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500 scale-85 origin-right">
                          <ChooseFigure active={revealedCount >= 3} />
                        </div>
                      </div>
                      <h3 className="font-cinzel text-sm md:text-base font-bold leading-snug text-white mb-1 text-balance">
                        {steps[2].title}
                      </h3>
                      <p className="text-xs md:text-[13px] leading-relaxed text-gray-400 font-normal text-pretty line-clamp-3">
                        {steps[2].body}
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                      <span className="uppercase tracking-widest whitespace-nowrap">Etapa 3 de 4</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
                    </div>
                  </article>

                  {/* Card 04 (Direita — delay para surgir da esquerda para direita) */}
                  <article
                    className={`h-full ${landingMockupFloatClass} p-4 md:p-5 flex flex-col justify-between min-h-[155px] group transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      revealedCount >= 4
                        ? 'opacity-100 translate-x-0 scale-100 delay-150'
                        : 'opacity-0 -translate-x-4 scale-95 pointer-events-none'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="font-cinzel text-[11px] font-bold tracking-[0.18em] text-[#f2ca50] bg-[#f2ca50]/10 px-2.5 py-0.5 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                          PASSO {steps[3].stepNumber}
                        </span>
                        <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500 scale-85 origin-right">
                          <DownloadFigure active={revealedCount >= 4} />
                        </div>
                      </div>
                      <h3 className="font-cinzel text-sm md:text-base font-bold leading-snug text-white mb-1 text-balance">
                        {steps[3].title}
                      </h3>
                      <p className="text-xs md:text-[13px] leading-relaxed text-gray-400 font-normal text-pretty line-clamp-3">
                        {steps[3].body}
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                      <span className="uppercase tracking-widest whitespace-nowrap">Etapa 4 de 4</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
                    </div>
                  </article>

                  {/* Seta horizontal na linha 2 */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <StepArrow direction="right" active={revealedCount >= 4} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


