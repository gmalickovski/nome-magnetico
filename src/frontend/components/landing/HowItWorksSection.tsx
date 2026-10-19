import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  LandingSectionIntro,
  landingInteractiveCardClass,
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
        className={horizontal ? 'h-5 w-8' : 'h-7 w-5 sm:h-8 sm:w-6'}
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

export function HowItWorksSection() {
  const { ref, progress, reduceMotion } = useScrollProgress<HTMLElement>();
  const introRef = useRef<HTMLDivElement>(null);
  const mobileCardRef = useRef<HTMLDivElement>(null);
  const [mobileCardStepHeight, setMobileCardStepHeight] = useState(215);

  // Mensuração dinâmica da altura do bloco de card no mobile
  useEffect(() => {
    if (!mobileCardRef.current) return;
    const measure = () => {
      if (mobileCardRef.current) {
        const h = mobileCardRef.current.offsetHeight;
        if (h > 120) setMobileCardStepHeight(h);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // ── CORE PROGRESSION CHOREOGRAPHY ──────────────────────────────────────────
  // DESKTOP (lg: 1024px+): 100% intacto conforme aprovado.
  // MOBILE & TABLET (< lg:): Título inicia centralizado na área útil sozinho.
  // Cards iniciam 100% ocultos (opacity 0) e só entram após o texto começar a subir e dissolver.
  const {
    // Desktop variables (DO NOT TOUCH)
    introOpacity,
    introTranslateY,
    cardEntryY,
    railOffsetPercent,
    cardVisibility,
    arrowVisibility,
    // Tablet variables
    row1Shift,
    card2Vis,
    arrow1Active,
    row2Opacity,
    row2Shift,
    card3Vis,
    card4Vis,
    arrow2Active,
    // Mobile variables
    mobileRailShift,
    mobileCardOpacities,
    mobileArrowActives,
    // Mobile/Tablet Intro & Card Entry
    mobTabIntroOp,
    mobTabIntroY,
    mobTabCardsOp,
    mobTabCardsY,
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
        row1Shift: 1,
        card2Vis: 1,
        arrow1Active: true,
        row2Opacity: 1,
        row2Shift: 1,
        card3Vis: 1,
        card4Vis: 1,
        arrow2Active: true,
        mobileRailShift: 0,
        mobileCardOpacities: [1, 1, 1, 1],
        mobileArrowActives: [true, true, true],
        mobTabIntroOp: 1,
        mobTabIntroY: 0,
        mobTabCardsOp: 1,
        mobTabCardsY: 0,
        activeStepIndex: 0,
      };
    }

    // ── FASE 1: DESKTOP (INTACTO) ──
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

    // ── FASE 1: MOBILE & TABLET (< 1024px) ──
    // Inicialmente: Título centralizado na área útil (y = 0), Cards 100% invisíveis (opacity = 0)
    let mtIntroOp = 1;
    let mtIntroY = 0;
    let mtCardsOp = 0;
    let mtCardsY = 220;

    if (progress <= 0) {
      mtIntroOp = 1;
      mtIntroY = 0;
      mtCardsOp = 0;
      mtCardsY = 220;
    } else if (progress < INTRO_PHASE_END) {
      const t = progress / INTRO_PHASE_END; // 0.0 -> 1.0

      // Texto sobe do centro em direção ao header (-140px)
      const rollT = Math.min(1, t / 0.55);
      const rollEase = rollT * rollT * (3 - 2 * rollT);
      mtIntroY = -rollEase * 140;

      // Texto dissolve gradualmente e some completamente até t = 0.65
      const fadeT = Math.min(1, t / 0.65);
      const fadeEase = fadeT * fadeT * (3 - 2 * fadeT);
      mtIntroOp = Math.max(0, 1 - fadeEase);

      // Cards surgem suavemente apenas a partir de t = 0.40, subindo de 220px até 0px
      if (t < 0.40) {
        mtCardsOp = 0;
        mtCardsY = 220;
      } else {
        const cardT = (t - 0.40) / 0.60; // 0.0 -> 1.0
        const cardEase = cardT * cardT * (3 - 2 * cardT);
        mtCardsOp = cardEase;
        mtCardsY = (1 - cardEase) * 220;
      }
    } else {
      mtIntroOp = 0;
      mtIntroY = -140;
      mtCardsOp = 1;
      mtCardsY = 0;
    }

    // ── FASE 2: Revelação Sequencial dos Passos (progress: 0.18 -> 0.78) ──
    const REVEAL_PHASE_END = 0.78;
    const revProg = progress <= INTRO_PHASE_END
      ? 0
      : Math.min(1, (progress - INTRO_PHASE_END) / (REVEAL_PHASE_END - INTRO_PHASE_END));

    const currentActiveStep = revProg < 0.28 ? 0 : revProg < 0.58 ? 1 : revProg < 0.85 ? 2 : 3;

    // ── 1. Desktop Rail (Horizontal — INTACTO) ──
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

    // ── 2. Tablet 2x2 Grid (768px a 1023px) ──
    let r1Shift = 0;
    let c2Vis = 0;
    let a1Active = false;

    if (revProg < 0.05) {
      r1Shift = 0;
      c2Vis = 0;
      a1Active = false;
    } else if (revProg < 0.40) {
      const t = (revProg - 0.05) / 0.35;
      const ease = t * t * (3 - 2 * t);
      r1Shift = ease;
      c2Vis = ease;
      a1Active = t > 0.25;
    } else {
      r1Shift = 1;
      c2Vis = 1;
      a1Active = true;
    }

    let r2Opacity = 0;
    let r2Shift = 0;
    let c3Vis = 0;
    let c4Vis = 0;
    let a2Active = false;

    if (revProg < 0.40) {
      r2Opacity = 0;
      c3Vis = 0;
      r2Shift = 0;
      c4Vis = 0;
      a2Active = false;
    } else if (revProg < 0.70) {
      const t = (revProg - 0.40) / 0.30;
      const ease = t * t * (3 - 2 * t);
      r2Opacity = ease;
      c3Vis = ease;
      r2Shift = 0;
      c4Vis = 0;
      a2Active = false;
    } else {
      const t = Math.min(1, (revProg - 0.70) / 0.30);
      const ease = t * t * (3 - 2 * t);
      r2Opacity = 1;
      c3Vis = 1;
      r2Shift = ease;
      c4Vis = ease;
      a2Active = t > 0.25;
    }

    // ── 3. Mobile Vertical Stacked Rail (< 768px) ──
    let mShift = 0;
    const mCardOps = [1, 0, 0, 0];
    const mArrowActives = [false, false, false];

    if (revProg < 0.05) {
      mShift = 0;
      mCardOps[0] = 1;
      mCardOps[1] = 0;
      mCardOps[2] = 0;
      mCardOps[3] = 0;
      mArrowActives[0] = false;
    } else if (revProg < 0.36) {
      const t = (revProg - 0.05) / 0.31;
      const ease = t * t * (3 - 2 * t);
      mShift = ease * 1;
      mCardOps[0] = Math.max(0.25, 1 - ease * 0.75);
      mCardOps[1] = ease;
      mCardOps[2] = 0;
      mCardOps[3] = 0;
      mArrowActives[0] = t > 0.2;
    } else if (revProg < 0.68) {
      mArrowActives[0] = true;
      mCardOps[0] = 0.25;
      const t = (revProg - 0.36) / 0.32;
      const ease = t * t * (3 - 2 * t);
      mShift = 1 + ease * 1;
      mCardOps[1] = Math.max(0.25, 1 - ease * 0.75);
      mCardOps[2] = ease;
      mCardOps[3] = 0;
      mArrowActives[1] = t > 0.2;
    } else {
      mArrowActives[0] = true;
      mArrowActives[1] = true;
      mCardOps[0] = 0.2;
      mCardOps[1] = 0.25;
      const t = Math.min(1, (revProg - 0.68) / 0.32);
      const ease = t * t * (3 - 2 * t);
      mShift = 2 + ease * 1;
      mCardOps[2] = Math.max(0.25, 1 - ease * 0.75);
      mCardOps[3] = ease;
      mArrowActives[2] = t > 0.2;
    }

    return {
      introOpacity: introOp,
      introTranslateY: introY,
      cardEntryY: cardY,
      railOffsetPercent: offset,
      cardVisibility: cardVis,
      arrowVisibility: arrowVis,
      row1Shift: r1Shift,
      card2Vis: c2Vis,
      arrow1Active: a1Active,
      row2Opacity: r2Opacity,
      row2Shift: r2Shift,
      card3Vis: c3Vis,
      card4Vis: c4Vis,
      arrow2Active: a2Active,
      mobileRailShift: mShift,
      mobileCardOpacities: mCardOps,
      mobileArrowActives: mArrowActives,
      mobTabIntroOp: mtIntroOp,
      mobTabIntroY: mtIntroY,
      mobTabCardsOp: mtCardsOp,
      mobTabCardsY: mtCardsY,
      activeStepIndex: currentActiveStep,
    };
  }, [progress, reduceMotion]);

  return (
    <section
      id="como-funciona"
      ref={ref}
      className={`relative z-10 bg-[#111111] scroll-mt-24 lg:scroll-mt-28 overflow-clip ${
        reduceMotion
          ? landingSectionSpacingClass
          : 'h-[360vh]'
      }`}
      aria-label="Como funciona"
    >
      {/* ── UNIFIED PINNED CONTAINER (DESKTOP, TABLET, MOBILE) ─────── */}
      {/* Centralizado na ÁREA ÚTIL: desconta a altura do header fixo (pt-[72px] sm:pt-[76px] lg:pt-[80px]) */}
      <div
        data-sticky-container
        className={`w-full flex flex-col ${
          reduceMotion
            ? 'py-16 sm:py-20 lg:py-28'
            : 'sticky top-0 h-screen min-h-screen pt-[72px] sm:pt-[76px] lg:pt-[80px] pb-4 sm:pb-6 overflow-hidden'
        }`}
      >
        {/* ÁREA ÚTIL CONTAINER: altura total da janela menos o header */}
        <div className="flex-1 relative flex flex-col justify-center items-center w-full min-h-0">
          <div className={`${landingSectionShellClass} relative flex flex-col items-center justify-center w-full h-full min-h-0`}>

            {/* ── TÍTULO DA SEÇÃO (DESKTOP: lg: 1024px+ — INTACTO) ── */}
            <div
              className="hidden lg:block w-full text-center absolute top-2 sm:top-3 lg:top-4 left-0 right-0 z-10 will-change-[transform,opacity] pointer-events-none px-4"
              style={{
                opacity: introOpacity,
                transform: `translateY(${introTranslateY}px)`,
                visibility: introOpacity <= 0 ? 'hidden' : 'visible',
              }}
            >
              <div ref={introRef} className="w-full text-center max-w-4xl mx-auto">
                <LandingSectionIntro
                  label="Como funciona"
                  title="Quatro passos da sua nota hoje até a nova assinatura"
                  description="Entenda como a análise cabalística compara a vibração atual do seu nome com o potencial máximo de harmonia."
                  titleClassName="text-2xl sm:text-2xl md:text-3xl lg:text-[2.25rem] xl:text-[2.5rem] font-bold uppercase tracking-wide max-w-4xl mx-auto leading-[1.25] lg:leading-[1.3] text-white text-balance"
                  descriptionClassName="max-w-[64ch] mx-auto text-sm sm:text-base mt-2 sm:mt-2.5 leading-relaxed text-pretty text-gray-400"
                  className="text-center"
                  revealed={true}
                  reduceMotion={reduceMotion}
                />
              </div>
            </div>

            {/* ── TÍTULO DA SEÇÃO (MOBILE & TABLET: < lg: — CENTRALIZADO INICIALMENTE NA ÁREA ÚTIL) ── */}
            <div
              className="lg:hidden w-full text-center absolute top-1/2 left-0 right-0 z-10 will-change-[transform,opacity] pointer-events-none px-4"
              style={{
                opacity: mobTabIntroOp,
                transform: `translateY(calc(-50% + ${mobTabIntroY}px))`,
                visibility: mobTabIntroOp <= 0 ? 'hidden' : 'visible',
              }}
            >
              <div className="w-full text-center max-w-lg md:max-w-2xl mx-auto">
                <LandingSectionIntro
                  label="Como funciona"
                  title="Quatro passos da sua nota hoje até a nova assinatura"
                  description="Entenda como a análise cabalística compara a vibração atual do seu nome com o potencial máximo de harmonia."
                  titleClassName="text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-wide max-w-lg md:max-w-2xl mx-auto leading-[1.25] text-white text-balance"
                  descriptionClassName="max-w-[46ch] md:max-w-[56ch] mx-auto text-xs sm:text-sm md:text-base mt-2 leading-relaxed text-pretty text-gray-400"
                  className="text-center"
                  revealed={true}
                  reduceMotion={reduceMotion}
                />
              </div>
            </div>

            {/* ── CARDS CONTAINER DESKTOP (lg: 1024px+ — INTACTO) ── */}
            <div
              className="hidden lg:flex w-full flex-col items-center justify-center my-auto z-20 will-change-transform"
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

                          {/* Rodapé decorativo */}
                          <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                            <span className="uppercase tracking-widest whitespace-nowrap">Etapa {index + 1} de 4</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
                          </div>
                        </article>

                        {/* Seta direcional horizontal entre os cards */}
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

              {/* Indicador de progresso desktop */}
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

            {/* ── CARDS CONTAINER MOBILE & TABLET (< lg: — SURGE APENAS APÓS O TÍTULO) ── */}
            <div
              className="lg:hidden w-full flex flex-col items-center justify-center my-auto z-20 will-change-[transform,opacity]"
              style={{
                opacity: mobTabCardsOp,
                transform: `translateY(${mobTabCardsY}px)`,
                visibility: mobTabCardsOp <= 0 ? 'hidden' : 'visible',
                pointerEvents: mobTabCardsOp <= 0.1 ? 'none' : 'auto',
              }}
            >
              {/* 2. TABLET 2x2 GRID VIEW (md: 768px a 1023px — iPad, iPad Mini, iPad Air) ─ */}
              {/* Cards compactos e responsivos para caber com folga em qualquer altura de tela */}
              <div className="hidden md:flex lg:hidden flex-col gap-3 md:gap-4 w-full max-w-3xl md:max-w-4xl px-4 md:px-6 mx-auto py-1">
                {/* LINHA 1: Cards 01 e 02 */}
                <div className="relative grid grid-cols-2 gap-3.5 md:gap-5 w-full items-stretch">
                  {/* Card 01 — Inicia centralizado e desloca para a esquerda */}
                  <div
                    className="relative h-full will-change-transform"
                    style={{
                      transform: `translateX(calc(${(1 - row1Shift)} * (50% + 7px)))`,
                      zIndex: 10,
                    }}
                  >
                    <article className={`h-full ${landingInteractiveCardClass} p-3.5 sm:p-4 md:p-5 flex flex-col justify-between min-h-[140px] sm:min-h-[155px] md:min-h-[170px] group`}>
                      <div>
                        <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                          <span className="font-cinzel text-[10px] sm:text-[11px] font-bold tracking-[0.18em] text-[#f2ca50] bg-[#f2ca50]/10 px-2.5 py-0.5 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                            PASSO {steps[0].stepNumber}
                          </span>
                          <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500 scale-85 origin-right">
                            <FormFigure active={true} />
                          </div>
                        </div>

                        <h3 className="font-cinzel text-xs sm:text-sm md:text-base font-bold leading-snug text-white mb-1 text-balance">
                          {steps[0].title}
                        </h3>
                        <p className="text-[11px] sm:text-xs md:text-[13px] leading-relaxed text-gray-400 font-normal text-pretty line-clamp-2 sm:line-clamp-3">
                          {steps[0].body}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                        <span className="uppercase tracking-widest whitespace-nowrap">Etapa 1 de 4</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
                      </div>
                    </article>
                  </div>

                  {/* Card 02 — Entra na coluna da direita com fade-in */}
                  <div
                    className="relative h-full will-change-[transform,opacity]"
                    style={{
                      opacity: card2Vis,
                      transform: `translateY(${(1 - card2Vis) * 12}px) scale(${0.96 + card2Vis * 0.04})`,
                      pointerEvents: card2Vis > 0.1 ? 'auto' : 'none',
                      zIndex: 5,
                    }}
                  >
                    <article className={`h-full ${landingInteractiveCardClass} p-3.5 sm:p-4 md:p-5 flex flex-col justify-between min-h-[140px] sm:min-h-[155px] md:min-h-[170px] group`}>
                      <div>
                        <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                          <span className="font-cinzel text-[10px] sm:text-[11px] font-bold tracking-[0.18em] text-[#f2ca50] bg-[#f2ca50]/10 px-2.5 py-0.5 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                            PASSO {steps[1].stepNumber}
                          </span>
                          <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500 scale-85 origin-right">
                            <GenerateFigure active={card2Vis > 0.1} />
                          </div>
                        </div>

                        <h3 className="font-cinzel text-xs sm:text-sm md:text-base font-bold leading-snug text-white mb-1 text-balance">
                          {steps[1].title}
                        </h3>
                        <p className="text-[11px] sm:text-xs md:text-[13px] leading-relaxed text-gray-400 font-normal text-pretty line-clamp-2 sm:line-clamp-3">
                          {steps[1].body}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                        <span className="uppercase tracking-widest whitespace-nowrap">Etapa 2 de 4</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
                      </div>
                    </article>
                  </div>

                  {/* Seta horizontal na linha 1 */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <StepArrow direction="right" active={arrow1Active} />
                  </div>
                </div>

                {/* LINHA 2: Cards 03 e 04 */}
                <div
                  className="relative grid grid-cols-2 gap-3.5 md:gap-5 w-full items-stretch will-change-opacity transition-opacity duration-300"
                  style={{
                    opacity: row2Opacity,
                    pointerEvents: row2Opacity > 0.1 ? 'auto' : 'none',
                  }}
                >
                  {/* Card 03 — Inicia centralizado na linha 2 e desloca para a esquerda */}
                  <div
                    className="relative h-full will-change-transform"
                    style={{
                      opacity: card3Vis,
                      transform: `translateX(calc(${(1 - row2Shift)} * (50% + 7px))) translateY(${(1 - card3Vis) * 12}px)`,
                      zIndex: 10,
                    }}
                  >
                    <article className={`h-full ${landingInteractiveCardClass} p-3.5 sm:p-4 md:p-5 flex flex-col justify-between min-h-[140px] sm:min-h-[155px] md:min-h-[170px] group`}>
                      <div>
                        <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                          <span className="font-cinzel text-[10px] sm:text-[11px] font-bold tracking-[0.18em] text-[#f2ca50] bg-[#f2ca50]/10 px-2.5 py-0.5 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                            PASSO {steps[2].stepNumber}
                          </span>
                          <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500 scale-85 origin-right">
                            <ChooseFigure active={card3Vis > 0.1} />
                          </div>
                        </div>

                        <h3 className="font-cinzel text-xs sm:text-sm md:text-base font-bold leading-snug text-white mb-1 text-balance">
                          {steps[2].title}
                        </h3>
                        <p className="text-[11px] sm:text-xs md:text-[13px] leading-relaxed text-gray-400 font-normal text-pretty line-clamp-2 sm:line-clamp-3">
                          {steps[2].body}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                        <span className="uppercase tracking-widest whitespace-nowrap">Etapa 3 de 4</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
                      </div>
                    </article>
                  </div>

                  {/* Card 04 — Entra na coluna da direita com fade-in */}
                  <div
                    className="relative h-full will-change-[transform,opacity]"
                    style={{
                      opacity: card4Vis,
                      transform: `translateY(${(1 - card4Vis) * 12}px) scale(${0.96 + card4Vis * 0.04})`,
                      pointerEvents: card4Vis > 0.1 ? 'auto' : 'none',
                      zIndex: 5,
                    }}
                  >
                    <article className={`h-full ${landingInteractiveCardClass} p-3.5 sm:p-4 md:p-5 flex flex-col justify-between min-h-[140px] sm:min-h-[155px] md:min-h-[170px] group`}>
                      <div>
                        <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                          <span className="font-cinzel text-[10px] sm:text-[11px] font-bold tracking-[0.18em] text-[#f2ca50] bg-[#f2ca50]/10 px-2.5 py-0.5 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                            PASSO {steps[3].stepNumber}
                          </span>
                          <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500 scale-85 origin-right">
                            <DownloadFigure active={card4Vis > 0.1} />
                          </div>
                        </div>

                        <h3 className="font-cinzel text-xs sm:text-sm md:text-base font-bold leading-snug text-white mb-1 text-balance">
                          {steps[3].title}
                        </h3>
                        <p className="text-[11px] sm:text-xs md:text-[13px] leading-relaxed text-gray-400 font-normal text-pretty line-clamp-2 sm:line-clamp-3">
                          {steps[3].body}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                        <span className="uppercase tracking-widest whitespace-nowrap">Etapa 4 de 4</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
                      </div>
                    </article>
                  </div>

                  {/* Seta horizontal na linha 2 */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <StepArrow direction="right" active={arrow2Active} />
                  </div>
                </div>
              </div>

              {/* 3. MOBILE SMARTPHONE VERTICAL STACKED RAIL (< md: — Smartphones & Small Viewports) */}
              {/* Cards empilhados um abaixo do outro com setas para baixo no bottom, aproveitando a largura da tela como o Hero card */}
              <div className="md:hidden w-full max-w-lg sm:max-w-xl px-4 sm:px-6 mx-auto relative flex flex-col items-center justify-center overflow-visible">
                <div
                  className="w-full flex flex-col items-center will-change-transform"
                  style={{
                    transform: `translateY(-${mobileRailShift * mobileCardStepHeight}px)`,
                  }}
                >
                  {steps.map((step, idx) => {
                    const Figure = step.Figure;
                    const opacity = reduceMotion ? 1 : mobileCardOpacities[idx];
                    const hasDownArrow = idx < steps.length - 1;
                    const isArrowActive = reduceMotion || mobileArrowActives[idx];

                    return (
                      <div
                        key={step.stepNumber}
                        ref={idx === 0 ? mobileCardRef : undefined}
                        className="w-full flex flex-col items-center will-change-[transform,opacity] transition-opacity duration-300"
                        style={{
                          opacity,
                          visibility: opacity <= 0 ? 'hidden' : 'visible',
                          pointerEvents: opacity < 0.2 ? 'none' : 'auto',
                        }}
                      >
                        <article
                          className={`w-full ${landingInteractiveCardClass} p-4 sm:p-5 md:p-6 flex flex-col justify-between min-h-[160px] sm:min-h-[175px] group`}
                        >
                          <div>
                            {/* Header: Passo & Ícone */}
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="font-cinzel text-[11px] sm:text-xs font-bold tracking-[0.2em] text-[#f2ca50] bg-[#f2ca50]/10 px-2.5 py-0.5 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                                PASSO {step.stepNumber}
                              </span>
                              <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500 scale-90 origin-right">
                                <Figure active={opacity > 0.4} />
                              </div>
                            </div>

                            {/* Título & Descrição */}
                            <h3 className="font-cinzel text-sm sm:text-base font-bold leading-snug text-white mb-1.5 text-balance">
                              {step.title}
                            </h3>
                            <p className="text-xs sm:text-[13px] leading-relaxed text-gray-400 font-normal text-pretty line-clamp-3">
                              {step.body}
                            </p>
                          </div>

                          {/* Rodapé */}
                          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                            <span className="uppercase tracking-widest whitespace-nowrap">
                              Etapa {idx + 1} de 4
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
                          </div>
                        </article>

                        {/* Seta para baixo apontando para o próximo card */}
                        {hasDownArrow && (
                          <div className="py-1.5 flex justify-center items-center pointer-events-none">
                            <StepArrow direction="down" active={isArrowActive} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Indicador de progresso compartilhado mobile e tablet */}
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
    </section>
  );
}

