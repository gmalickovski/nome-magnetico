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

/** Card de passo no layout mobile e tablet (2x2 grid no iPad, 1 col no mobile) */
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
  const itemRef = useRef<HTMLDivElement>(null);
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
    <div
      ref={itemRef}
      className={`relative flex flex-col justify-between w-full h-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        reduceMotion || revealed
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-8 scale-95'
      }`}
      role="listitem"
    >
      <article className={`w-full h-full ${landingInteractiveCardClass} p-5 sm:p-6 md:p-7 flex flex-col justify-between min-h-[250px] sm:min-h-[270px] md:min-h-[280px] group`}>
        <div>
          {/* Header do Card: Número do Passo & SVG */}
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <span className="font-cinzel text-xs font-bold tracking-[0.2em] text-[#f2ca50] bg-[#f2ca50]/10 px-3 py-1 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
              PASSO {step.stepNumber}
            </span>
            <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500">
              <Figure active={reduceMotion || revealed} />
            </div>
          </div>

          {/* Título & Descrição */}
          <h3 className="font-cinzel text-base sm:text-lg md:text-xl font-bold leading-snug text-white mb-2.5 text-balance">
            {step.title}
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed text-gray-400 font-normal text-pretty">
            {step.body}
          </p>
        </div>

        {/* Rodapé do Card com Etapa e indicador */}
        <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
          <span className="uppercase tracking-widest whitespace-nowrap">Etapa {index + 1} de 4</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
        </div>
      </article>

      {/* Seta vertical no mobile (apenas quando 1 coluna e não for o último passo) */}
      {!isLast && (
        <div
          className={`py-2.5 sm:hidden flex justify-center transition-all duration-700 delay-150 ease-out pointer-events-none ${
            reduceMotion || revealed
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-2 scale-75'
          }`}
          aria-hidden="true"
        >
          <StepArrow direction="down" active={reduceMotion || revealed} />
        </div>
      )}
    </div>
  );
}

export function HowItWorksSection() {
  const { ref, progress, approach, reduceMotion } = useScrollProgress<HTMLElement>();
  const introRef = useRef<HTMLDivElement>(null);
  const [naturalIntroHeight, setNaturalIntroHeight] = useState(280);

  // Progressive measurement of intro height to prevent any clipping on start
  useEffect(() => {
    if (!introRef.current) return;
    const updateHeight = () => {
      if (introRef.current) {
        const height = introRef.current.offsetHeight || introRef.current.scrollHeight;
        if (height > 50) {
          setNaturalIntroHeight(height);
        }
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Progress metrics calculation for Desktop, Tablet (2x2) and Mobile pinned scroll:
  // Phase 1: Intro begins dissolving when almost touching header (approach: 0 -> 1).
  // By the time the section locks sticky (approach = 1), the intro is 100% dissolved.
  // Phase 2 (progress: 0.00 -> 1.00): Sequential card reveal across all viewports.
  const {
    introOpacity,
    introTranslateY,
    introHeight,
    introMarginBottom,
    railOffsetPercent,
    cardVisibility,
    arrowVisibility,
    row1Shift,
    card2Vis,
    arrow1Active,
    row2Opacity,
    row2Shift,
    card3Vis,
    card4Vis,
    arrow2Active,
  } = useMemo(() => {
    if (reduceMotion) {
      return {
        introOpacity: 1,
        introTranslateY: 0,
        introHeight: naturalIntroHeight,
        introMarginBottom: 32,
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
      };
    }

    // O título só começa a desvanecer quando estiver quase encostando no header (approach > 0)
    // Se approach <= 0, fica 100% visível, nítido e na altura natural
    const introExit = Math.min(1, Math.max(0, approach));
    const introSmooth = introExit * introExit * (3 - 2 * introExit);

    const introOp = approach <= 0 ? 1 : Math.max(0, 1 - introSmooth);
    const introY = -introSmooth * 30;
    const introH = approach <= 0 ? naturalIntroHeight : Math.max(0, naturalIntroHeight * (1 - introSmooth));
    const introMB = approach <= 0 ? 32 : Math.max(0, 32 * (1 - introSmooth));

    // Sequential Card Reveal (progress: 0.00 -> 1.00)
    const cardVis = [1, 0, 0, 0];
    const arrowVis = [false, false, false];

    if (progress >= 0.10) {
      const t = Math.min(1, (progress - 0.10) / 0.28);
      const ease = t * t * (3 - 2 * t);
      cardVis[1] = ease;
      arrowVis[0] = t > 0.25;
    }

    if (progress >= 0.38) {
      const t = Math.min(1, (progress - 0.38) / 0.27);
      const ease = t * t * (3 - 2 * t);
      cardVis[2] = ease;
      arrowVis[1] = t > 0.25;
    }

    if (progress >= 0.65) {
      const t = Math.min(1, (progress - 0.65) / 0.30);
      const ease = t * t * (3 - 2 * t);
      cardVis[3] = ease;
      arrowVis[2] = t > 0.25;
    }

    // Desktop Horizontal Rail Offset:
    // Starts at 37.5% (Card 1 centered)
    // Shifts to 25.0% when Card 2 enters
    // Shifts to 12.5% when Card 3 enters
    // Shifts to 0.0% when Card 4 enters
    let offset = 37.5;
    if (progress < 0.10) {
      offset = 37.5;
    } else if (progress < 0.38) {
      const t = (progress - 0.10) / 0.28;
      const ease = t * t * (3 - 2 * t);
      offset = 37.5 - ease * 12.5;
    } else if (progress < 0.65) {
      const t = (progress - 0.38) / 0.27;
      const ease = t * t * (3 - 2 * t);
      offset = 25.0 - ease * 12.5;
    } else {
      const t = Math.min(1, (progress - 0.65) / 0.30);
      const ease = t * t * (3 - 2 * t);
      offset = 12.5 - ease * 12.5;
    }

    // ── TABLET 2x2 CHOREOGRAPHY (sm: 640px to lg: 1023px) ──
    // Row 1 (Cards 01 & 02):
    // - Card 01 starts centered in Row 1.
    // - As progress moves 0.10 -> 0.38, Card 01 shifts left to 0%, Card 02 enters.
    let r1Shift = 0; // 0 = centered, 1 = left
    let c2Vis = 0;
    let a1Active = false;

    if (progress < 0.10) {
      r1Shift = 0;
      c2Vis = 0;
      a1Active = false;
    } else if (progress < 0.38) {
      const t = (progress - 0.10) / 0.28;
      const ease = t * t * (3 - 2 * t);
      r1Shift = ease;
      c2Vis = ease;
      a1Active = t > 0.25;
    } else {
      r1Shift = 1;
      c2Vis = 1;
      a1Active = true;
    }

    // Row 2 (Cards 03 & 04):
    // - Before 0.38: row is completely hidden.
    // - From 0.38 -> 0.65: Row 2 appears, Card 03 enters centered.
    // - From 0.65 -> 0.95: Card 03 shifts left to 0%, Card 04 enters.
    let r2Opacity = 0;
    let r2Shift = 0; // 0 = centered, 1 = left
    let c3Vis = 0;
    let c4Vis = 0;
    let a2Active = false;

    if (progress < 0.38) {
      r2Opacity = 0;
      c3Vis = 0;
      r2Shift = 0;
      c4Vis = 0;
      a2Active = false;
    } else if (progress < 0.65) {
      const t = (progress - 0.38) / 0.27;
      const ease = t * t * (3 - 2 * t);
      r2Opacity = ease;
      c3Vis = ease;
      r2Shift = 0;
      c4Vis = 0;
      a2Active = false;
    } else if (progress < 0.95) {
      const t = (progress - 0.65) / 0.30;
      const ease = t * t * (3 - 2 * t);
      r2Opacity = 1;
      c3Vis = 1;
      r2Shift = ease;
      c4Vis = ease;
      a2Active = t > 0.25;
    } else {
      r2Opacity = 1;
      c3Vis = 1;
      r2Shift = 1;
      c4Vis = 1;
      a2Active = true;
    }

    return {
      introOpacity: introOp,
      introTranslateY: introY,
      introHeight: introH,
      introMarginBottom: introMB,
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
    };
  }, [progress, approach, reduceMotion, naturalIntroHeight]);

  return (
    <section
      id="como-funciona"
      ref={ref}
      className={`relative z-10 bg-[#111111] scroll-mt-24 lg:scroll-mt-28 overflow-clip ${
        reduceMotion
          ? landingSectionSpacingClass
          : 'h-[350vh]'
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
            : 'sticky top-0 h-screen min-h-screen pt-[72px] sm:pt-[76px] lg:pt-[80px] pb-6 sm:pb-8 overflow-hidden'
        }`}
      >
        <div className="flex-1 flex flex-col justify-center items-center w-full min-h-0">
          <div className={`${landingSectionShellClass} flex flex-col items-center w-full my-auto min-h-0`}>
            {/* Section Intro: dissolves smoothly from center to header */}
            <div
              className="w-full text-center will-change-[height,opacity,transform] overflow-hidden"
              style={{
                height: introOpacity > 0 ? `${introHeight}px` : '0px',
                opacity: introOpacity,
                transform: `translateY(${introTranslateY}px)`,
                marginBottom: `${introMarginBottom}px`,
                pointerEvents: introOpacity > 0.1 ? 'auto' : 'none',
                visibility: introOpacity <= 0 ? 'hidden' : 'visible',
              }}
            >
              <div
                ref={introRef}
                className="w-full text-center"
              >
                <LandingSectionIntro
                  label="Como funciona"
                  title="Quatro passos da sua nota hoje até a nova assinatura"
                  description="Entenda como a análise cabalística compara a vibração atual do seu nome com o potencial máximo de harmonia."
                  titleClassName="text-xl sm:text-2xl md:text-3xl lg:text-[2.25rem] xl:text-[2.5rem] font-bold uppercase tracking-wide max-w-4xl mx-auto leading-[1.3] lg:leading-[1.35] text-white text-balance"
                  descriptionClassName="max-w-[64ch] mx-auto text-sm sm:text-base mt-3 md:mt-4 lg:mt-5 leading-relaxed text-pretty text-gray-400"
                  className="text-center"
                  revealed={true}
                  reduceMotion={reduceMotion}
                />
              </div>
            </div>

            {/* 1. DESKTOP RAIL VIEW (lg: 1024px+ — Notebook 14", Desktop, Ultrawide) ─ */}
            <div className="hidden lg:block relative w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto overflow-visible py-2">
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

                        {/* Brilho decorativo sutil na base */}
                        <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                          <span className="uppercase tracking-widest whitespace-nowrap">Etapa {index + 1} de 4</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
                        </div>
                      </article>

                      {/* Seta direcional entre os cards */}
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

            {/* 2. TABLET 2x2 GRID VIEW (sm: 640px to lg: 1023px — iPad, iPad Mini, iPad Air) ─ */}
            {/* O 1º card de cada linha sempre inicia centralizado e desloca para a esquerda conforme o outro entra */}
            <div className="hidden sm:flex lg:hidden flex-col gap-3.5 sm:gap-4 md:gap-5 w-full max-w-2xl md:max-w-3xl mx-auto py-1">
              {/* LINHA 1: Cards 01 e 02 */}
              <div className="relative grid grid-cols-2 gap-4 md:gap-6 w-full items-stretch">
                {/* Card 01 — Inicia centralizado e desloca para a esquerda */}
                <div
                  className="relative h-full will-change-transform"
                  style={{
                    transform: `translateX(calc(${(1 - row1Shift)} * (50% + 8px)))`,
                    zIndex: 10,
                  }}
                >
                  <article className={`h-full ${landingInteractiveCardClass} p-4 sm:p-5 flex flex-col justify-between min-h-[175px] sm:min-h-[190px] md:min-h-[205px] group`}>
                    <div>
                      <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                        <span className="font-cinzel text-[11px] font-bold tracking-[0.18em] text-[#f2ca50] bg-[#f2ca50]/10 px-2.5 py-0.5 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                          PASSO {steps[0].stepNumber}
                        </span>
                        <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500 scale-90 origin-right">
                          <FormFigure active={true} />
                        </div>
                      </div>

                      <h3 className="font-cinzel text-sm sm:text-base md:text-lg font-bold leading-snug text-white mb-1.5 text-balance">
                        {steps[0].title}
                      </h3>
                      <p className="text-xs sm:text-[13px] leading-relaxed text-gray-400 font-normal text-pretty">
                        {steps[0].body}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
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
                    transform: `translateY(${(1 - card2Vis) * 14}px) scale(${0.96 + card2Vis * 0.04})`,
                    pointerEvents: card2Vis > 0.1 ? 'auto' : 'none',
                    zIndex: 5,
                  }}
                >
                  <article className={`h-full ${landingInteractiveCardClass} p-4 sm:p-5 flex flex-col justify-between min-h-[175px] sm:min-h-[190px] md:min-h-[205px] group`}>
                    <div>
                      <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                        <span className="font-cinzel text-[11px] font-bold tracking-[0.18em] text-[#f2ca50] bg-[#f2ca50]/10 px-2.5 py-0.5 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                          PASSO {steps[1].stepNumber}
                        </span>
                        <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500 scale-90 origin-right">
                          <GenerateFigure active={card2Vis > 0.1} />
                        </div>
                      </div>

                      <h3 className="font-cinzel text-sm sm:text-base md:text-lg font-bold leading-snug text-white mb-1.5 text-balance">
                        {steps[1].title}
                      </h3>
                      <p className="text-xs sm:text-[13px] leading-relaxed text-gray-400 font-normal text-pretty">
                        {steps[1].body}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
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
                className="relative grid grid-cols-2 gap-4 md:gap-6 w-full items-stretch will-change-opacity transition-opacity duration-300"
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
                    transform: `translateX(calc(${(1 - row2Shift)} * (50% + 8px))) translateY(${(1 - card3Vis) * 14}px)`,
                    zIndex: 10,
                  }}
                >
                  <article className={`h-full ${landingInteractiveCardClass} p-4 sm:p-5 flex flex-col justify-between min-h-[175px] sm:min-h-[190px] md:min-h-[205px] group`}>
                    <div>
                      <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                        <span className="font-cinzel text-[11px] font-bold tracking-[0.18em] text-[#f2ca50] bg-[#f2ca50]/10 px-2.5 py-0.5 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                          PASSO {steps[2].stepNumber}
                        </span>
                        <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500 scale-90 origin-right">
                          <ChooseFigure active={card3Vis > 0.1} />
                        </div>
                      </div>

                      <h3 className="font-cinzel text-sm sm:text-base md:text-lg font-bold leading-snug text-white mb-1.5 text-balance">
                        {steps[2].title}
                      </h3>
                      <p className="text-xs sm:text-[13px] leading-relaxed text-gray-400 font-normal text-pretty">
                        {steps[2].body}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
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
                    transform: `translateY(${(1 - card4Vis) * 14}px) scale(${0.96 + card4Vis * 0.04})`,
                    pointerEvents: card4Vis > 0.1 ? 'auto' : 'none',
                    zIndex: 5,
                  }}
                >
                  <article className={`h-full ${landingInteractiveCardClass} p-4 sm:p-5 flex flex-col justify-between min-h-[175px] sm:min-h-[190px] md:min-h-[205px] group`}>
                    <div>
                      <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                        <span className="font-cinzel text-[11px] font-bold tracking-[0.18em] text-[#f2ca50] bg-[#f2ca50]/10 px-2.5 py-0.5 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                          PASSO {steps[3].stepNumber}
                        </span>
                        <div className="text-[#D4AF37] group-hover:scale-105 transition-transform duration-500 scale-90 origin-right">
                          <DownloadFigure active={card4Vis > 0.1} />
                        </div>
                      </div>

                      <h3 className="font-cinzel text-sm sm:text-base md:text-lg font-bold leading-snug text-white mb-1.5 text-balance">
                        {steps[3].title}
                      </h3>
                      <p className="text-xs sm:text-[13px] leading-relaxed text-gray-400 font-normal text-pretty">
                        {steps[3].body}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
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

            {/* 3. MOBILE SPOTLIGHT VIEW (< 640px — Smartphones) ────────── */}
            <div className="sm:hidden w-full max-w-sm mx-auto relative flex flex-col items-center justify-center min-h-[250px] py-1">
              <div className="relative w-full min-h-[240px]">
                {steps.map((step, index) => {
                  const Figure = step.Figure;
                  const currentStepIdx = progress < 0.25 ? 0 : progress < 0.55 ? 1 : progress < 0.82 ? 2 : 3;
                  const isActive = index === currentStepIdx;

                  return (
                    <div
                      key={step.stepNumber}
                      className={`w-full transition-all duration-500 ease-out ${
                        isActive
                          ? 'relative z-10 opacity-100 translate-y-0 scale-100'
                          : 'absolute inset-0 pointer-events-none opacity-0 translate-y-4 scale-95'
                      }`}
                    >
                      <article className={`h-full ${landingInteractiveCardClass} p-5 flex flex-col justify-between min-h-[240px]`}>
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="font-cinzel text-xs font-bold tracking-[0.2em] text-[#f2ca50] bg-[#f2ca50]/10 px-3 py-1 rounded-full ring-1 ring-[#f2ca50]/25 whitespace-nowrap">
                              PASSO {step.stepNumber}
                            </span>
                            <div className="text-[#D4AF37]">
                              <Figure active={isActive} />
                            </div>
                          </div>

                          <h3 className="font-cinzel text-base font-bold leading-snug text-white mb-2 text-balance">
                            {step.title}
                          </h3>
                          <p className="text-xs leading-relaxed text-gray-400 font-normal text-pretty">
                            {step.body}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                          <span className="uppercase tracking-widest whitespace-nowrap">Etapa {index + 1} de 4</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f2ca50]/50" />
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Indicador de progresso compartilhado em todas as telas */}
            {!reduceMotion && (
              <div className="mt-4 sm:mt-5 lg:mt-6 flex justify-center items-center gap-2.5">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      cardVisibility[idx] >= 0.7
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
    </section>
  );
}
