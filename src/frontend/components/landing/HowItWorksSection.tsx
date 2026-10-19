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
  const { ref, progress, reduceMotion } = useScrollProgress<HTMLElement>();
  const introRef = useRef<HTMLDivElement>(null);
  const [naturalIntroHeight, setNaturalIntroHeight] = useState(320);

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

  // Progress metrics calculation for Desktop pinned scroll with smooth, continuous choreography:
  // Phase 1 (progress: 0.00 -> 0.22): Seamless, subtle intro exit towards the header with smoothstep easing.
  // Intro drifts upward and fades out completely before height finishes collapsing, centering Card 1 with zero clipping.
  // Phase 2 (progress: 0.22 -> 1.00): Only after Card 1 is fully centered and text has vanished, Cards 2, 3 and 4
  // sequentially glide in with arrows and smoothstep rail shifts.
  const {
    introOpacity,
    introTranslateY,
    introHeight,
    introMarginBottom,
    railOffsetPercent,
    cardVisibility,
    arrowVisibility,
  } = useMemo(() => {
    if (reduceMotion) {
      return {
        introOpacity: 1,
        introTranslateY: 0,
        introHeight: naturalIntroHeight,
        introMarginBottom: 36,
        railOffsetPercent: 0,
        cardVisibility: [1, 1, 1, 1],
        arrowVisibility: [true, true, true],
      };
    }

    const PHASE_1_END = 0.22;

    // Phase 1: Intro exit & Card 1 centering (progress: 0.00 -> 0.22)
    let introOp = 1;
    let introY = 0;
    let introH = naturalIntroHeight;
    let introMB = 36;

    if (progress <= 0) {
      introOp = 1;
      introY = 0;
      introH = naturalIntroHeight;
      introMB = 36;
    } else if (progress < PHASE_1_END) {
      // Normalized progress in Phase 1 (0 to 1)
      const t = progress / PHASE_1_END;
      // Smoothstep easing: 3*t^2 - 2*t^3 for fluid start and end without abrupt jerk
      const smooth = t * t * (3 - 2 * t);

      // Intro fades out completely before height finishes collapsing, eliminating any text clipping
      introOp = Math.max(0, 1 - Math.min(1, t * 1.35));
      // Intro drifts smoothly upward towards the top/header
      introY = -smooth * 56;
      // Intro height collapses smoothly, pulling Card 1 to dead center
      introH = Math.max(0, naturalIntroHeight * (1 - smooth));
      introMB = Math.max(0, 36 * (1 - smooth));
    } else {
      introOp = 0;
      introY = -56;
      introH = 0;
      introMB = 0;
    }

    // Phase 2: Sequential Card Reveal & Rail Shift (progress: 0.22 -> 1.00)
    // Cards 2, 3 and 4 only begin entering after progress > PHASE_1_END
    let offset = 37.5;
    const cardVis = [1, 0, 0, 0];
    const arrowVis = [false, false, false];

    if (progress <= PHASE_1_END) {
      // Card 1 centered horizontally (37.5% track offset)
      offset = 37.5;
      cardVis[0] = 1;
    } else {
      // Normalized progress in Phase 2 (0 to 1)
      const p2 = (progress - PHASE_1_END) / (1 - PHASE_1_END);

      if (p2 <= 0.33) {
        // Revealing Card 2: rail shifts from 37.5% to 25.0%
        const t = p2 / 0.33;
        const ease = t * t * (3 - 2 * t);
        offset = 37.5 - ease * 12.5;
        cardVis[0] = 1;
        cardVis[1] = Math.min(1, ease * 1.25);
        arrowVis[0] = t > 0.15;
      } else if (p2 <= 0.66) {
        // Revealing Card 3: rail shifts from 25.0% to 12.5%
        const t = (p2 - 0.33) / 0.33;
        const ease = t * t * (3 - 2 * t);
        offset = 25.0 - ease * 12.5;
        cardVis[0] = 1;
        cardVis[1] = 1;
        arrowVis[0] = true;
        cardVis[2] = Math.min(1, ease * 1.25);
        arrowVis[1] = t > 0.15;
      } else {
        // Revealing Card 4: rail shifts from 12.5% to 0.0%
        const t = Math.min(1, (p2 - 0.66) / 0.34);
        const ease = t * t * (3 - 2 * t);
        offset = 12.5 - ease * 12.5;
        cardVis[0] = 1;
        cardVis[1] = 1;
        cardVis[2] = 1;
        cardVis[3] = Math.min(1, ease * 1.25);
        arrowVis[0] = true;
        arrowVis[1] = true;
        arrowVis[2] = t > 0.15;
      }
    }

    return {
      introOpacity: introOp,
      introTranslateY: introY,
      introHeight: introH,
      introMarginBottom: introMB,
      railOffsetPercent: offset,
      cardVisibility: cardVis,
      arrowVisibility: arrowVis,
    };
  }, [progress, reduceMotion, naturalIntroHeight]);

  return (
    <section
      id="como-funciona"
      ref={ref}
      className={`relative bg-[#111111] scroll-mt-24 lg:scroll-mt-28 ${
        reduceMotion
          ? landingSectionSpacingClass
          : 'min-[1150px]:h-[350vh] py-16 sm:py-20 md:py-24 min-[1150px]:py-0'
      }`}
      aria-label="Como funciona"
    >
      {/* ── DESKTOP PINNED EXPERIENCE (min-[1150px]: 1150px+) ──────────── */}
      <div
        className={`hidden min-[1150px]:flex flex-col justify-center items-center ${
          reduceMotion ? 'py-20 lg:py-28' : 'sticky top-0 h-screen pt-16 lg:pt-20 pb-12 lg:pb-14'
        } w-full overflow-x-clip`}
      >
        <div className={`${landingSectionShellClass} flex flex-col justify-center items-center w-full min-h-0`}>
          {/* Section Intro: fully visible at initial state, then smoothly glides up towards the header and fades out */}
          <div
            className="w-full text-center will-change-[height,opacity,transform]"
            style={{
              height: progress <= 0 ? 'auto' : `${introHeight}px`,
              opacity: introOpacity,
              transform: `translateY(${introTranslateY}px)`,
              marginBottom: `${introMarginBottom}px`,
              overflow: introOpacity > 0 ? 'visible' : 'hidden',
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
                descriptionClassName="max-w-[64ch] mx-auto text-sm sm:text-base mt-4 md:mt-5 leading-relaxed text-pretty text-gray-400"
                className="text-center"
                revealed={true}
                reduceMotion={reduceMotion}
              />
            </div>
          </div>

          {/* Rail Track with dynamic horizontal offset (capped at max-width on ultrawide monitors) */}
          <div className="relative w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto overflow-visible py-2">
            <div
              className="grid grid-cols-4 gap-6 xl:gap-8 items-stretch will-change-transform min-w-[1100px] max-w-[1440px] mx-auto"
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
                    className="relative h-full will-change-[transform,opacity] min-w-[260px] max-w-[360px]"
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

      {/* ── TABLET (2x2 GRID) & MOBILE (1-COL STACK) EXPERIENCE (< 1150px) ── */}
      <div className="min-[1150px]:hidden">
        <div className={landingSectionShellClass}>
          <LandingSectionIntro
            label="Como funciona"
            title="Quatro passos da sua nota hoje até a nova assinatura"
            description="Entenda como a análise cabalística compara a vibração atual do seu nome com o potencial máximo de harmonia."
            titleClassName="text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-wide leading-[1.3] text-white text-balance"
            descriptionClassName="max-w-[58ch] mx-auto text-sm sm:text-base mt-3 md:mt-4 leading-relaxed text-pretty text-gray-400"
            className="mb-8 sm:mb-10 md:mb-12 text-center"
            revealed={true}
            reduceMotion={reduceMotion}
          />

          {/* Responsive Layout: 1-col on mobile (< 640px), 2x2 grid on iPad/tablet (640px to 1149px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 md:gap-7 w-full max-w-4xl lg:max-w-5xl mx-auto" role="list">
            {steps.map((step, index) => (
              <MobileStepItem
                key={step.stepNumber}
                step={step}
                index={index}
                isLast={index === steps.length - 1}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
