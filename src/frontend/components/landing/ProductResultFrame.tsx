import React, { useEffect, useId, useRef, useState } from 'react';
import CompatibilityBadge from '../app/CompatibilityBadge';
import {
  HARMONY_STAR_CX,
  HARMONY_STAR_CY,
  HARMONY_STAR_GOLD_NUM_RADIUS,
  HARMONY_STAR_INNER_INNER,
  HARMONY_STAR_INNER_R,
  HARMONY_STAR_LABEL_ANCHORS,
  HARMONY_STAR_LABEL_DX,
  HARMONY_STAR_LABEL_DY,
  HARMONY_STAR_LABEL_RADIUS,
  HARMONY_STAR_OUTER_INNER,
  HARMONY_STAR_OUTER_R,
  HARMONY_STAR_RED_NUM_RADIUS,
  HARMONY_STAR_TIP_LABELS,
  HARMONY_STAR_VIEWBOX,
  harmonyStarPts,
  harmonyStarTipXY,
} from '../app/harmonizationStarGeometry';
import {
  landingMockupFloatClass,
  landingMockupTileClass,
} from './LandingSectionIntro';
import { ScoreCardRow } from './ScoreCardRow.js';
import { getScoreTierVisual } from './score-tier-visual.js';

export { getScoreTierVisual, type ScoreTierVisual } from './score-tier-visual.js';
export { ScoreCardRow, type ScoreCardRowProps } from './ScoreCardRow.js';

const GOLD = '#D4AF37';

/** Demo pairing validated against analisarNomeSocial("ANA PAULA FERREIRA LIMA", "15/03/1985"). */
const BIRTH_NAME = 'ANA PAULA FERREIRA LIMA';
const INDICATED_NAME = 'ANA PAULA FÉRREIRA';
const DEMO_SCORE_BIRTH = 42;
const DEMO_SCORE_HARMONIZED = 95;

const DEMO_GOLD_NUMS = [5, 9, 6, 5, 3];
const DEMO_RED_NUMS = [5, 7, 6, 3, 1];

const OUTER_PTS = harmonyStarPts(
  HARMONY_STAR_CX,
  HARMONY_STAR_CY,
  HARMONY_STAR_OUTER_R,
  HARMONY_STAR_OUTER_INNER,
);
const INNER_PTS = harmonyStarPts(
  HARMONY_STAR_CX,
  HARMONY_STAR_CY,
  HARMONY_STAR_INNER_R,
  HARMONY_STAR_INNER_INNER,
);

type Compat = 'favoravel' | 'neutro' | 'desfavoravel';

/** Dados de um card de sugestão (landing + chat). */
export interface HarmonySuggestionCardData {
  nome: string;
  score: number;
  compatibilidade: Compat;
  expressao: number;
  destino: number;
  motivacao: number;
  impressao: number;
  missao: number;
  bloqueios: number;
}

type DemoSuggestion = HarmonySuggestionCardData;

/** System suggestions (IA) — mirrors "Nossas Sugestões". */
const DEMO_SYSTEM_SUGGESTIONS: DemoSuggestion[] = [
  {
    nome: 'ANA PAULA FÉRREIRA',
    score: 95,
    compatibilidade: 'favoravel',
    expressao: 9,
    destino: 5,
    motivacao: 6,
    impressao: 3,
    missao: 5,
    bloqueios: 0,
  },
  {
    nome: 'ANA',
    score: 84,
    compatibilidade: 'favoravel',
    expressao: 7,
    destino: 5,
    motivacao: 2,
    impressao: 5,
    missao: 3,
    bloqueios: 0,
  },
  {
    nome: 'ANA PAULA',
    score: 65,
    compatibilidade: 'desfavoravel',
    expressao: 8,
    destino: 5,
    motivacao: 1,
    impressao: 7,
    missao: 4,
    bloqueios: 0,
  },
];

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Full-width responsive container (no destructive CSS zoom).
 * Preserves 100% of the 7-column grid width across 13"/14" laptops and desktops.
 */
const desktopFitClass = 'w-full min-w-0';

/** Stack gap leaves room for the shared float shadow between cards. */
const desktopStackClass = 'w-full min-w-0 flex flex-col gap-3 sm:gap-3.5 xl:gap-4';

/**
 * Floating suggestion tile with clean single shadow and smooth stagger reveal.
 * Preserves the internal ProductAnimatedScore bar animation untouched.
 */
/** Card de sugestão harmonizada (landing + chat). */
export function HarmonySuggestionCard({
  c,
  stagger,
  delayIndex,
  className = '',
}: {
  c: HarmonySuggestionCardData;
  stagger: boolean;
  delayIndex: number;
  className?: string;
}) {
  return (
    <div
      className={`${landingMockupTileClass} px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col gap-2 min-w-0 w-full transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        stagger ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
      style={{ transitionDelay: stagger ? `${delayIndex * 80}ms` : '0ms' }}
    >
      <ScoreCardRow
        nome={c.nome}
        score={c.score}
        scoreTrailing={<CompatibilityBadge compatibilidade={c.compatibilidade} size="sm" />}
      />

      <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
        <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10.5px] sm:text-xs text-gray-400">
          <span className="whitespace-nowrap">
            Expr: <span className="text-gray-200 font-medium">{c.expressao}</span>
          </span>
          <span className="whitespace-nowrap">
            Dest: <span className="text-[#D4AF37] font-semibold">{c.destino}</span>
          </span>
          <span className="whitespace-nowrap">
            Mot: <span className="text-gray-200 font-medium">{c.motivacao}</span>
          </span>
          <span className="whitespace-nowrap">
            Imp: <span className="text-gray-200 font-medium">{c.impressao}</span>
          </span>
          <span className="whitespace-nowrap">
            Mis: <span className="text-gray-200 font-medium">{c.missao}</span>
          </span>
        </div>

        {c.bloqueios > 0 ? (
          <span className="text-[10.5px] sm:text-xs font-medium text-red-400 whitespace-nowrap">
            ⚠ {c.bloqueios} bloqueio(s)
          </span>
        ) : (
          <span className="text-[10.5px] sm:text-xs font-medium text-emerald-400 whitespace-nowrap">
            ✓ Sem bloqueios
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Gera path SVG com pontas e vértices suavemente arredondados para a estrela da harmonização.
 */
export function harmonyStarRoundedPath(
  cx: number,
  cy: number,
  R: number,
  r: number,
  outerRound: number = 12,
  innerRound: number = 7,
): string {
  const vertices: { x: number; y: number; round: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = ((-90 + i * 36) * Math.PI) / 180;
    const radius = i % 2 === 0 ? R : r;
    const round = i % 2 === 0 ? outerRound : innerRound;
    vertices.push({
      x: +(cx + radius * Math.cos(angle)).toFixed(2),
      y: +(cy + radius * Math.sin(angle)).toFixed(2),
      round,
    });
  }

  const segments: {
    start: { x: number; y: number };
    ctrl: { x: number; y: number };
    end: { x: number; y: number };
  }[] = [];

  for (let i = 0; i < 10; i++) {
    const prev = vertices[(i + 9) % 10];
    const curr = vertices[i];
    const next = vertices[(i + 1) % 10];

    const dpx = prev.x - curr.x;
    const dpy = prev.y - curr.y;
    const lenP = Math.hypot(dpx, dpy);
    const roundP = Math.min(curr.round, lenP * 0.45);

    const dnx = next.x - curr.x;
    const dny = next.y - curr.y;
    const lenN = Math.hypot(dnx, dny);
    const roundN = Math.min(curr.round, lenN * 0.45);

    segments.push({
      start: {
        x: +(curr.x + (dpx / lenP) * roundP).toFixed(2),
        y: +(curr.y + (dpy / lenP) * roundP).toFixed(2),
      },
      ctrl: { x: curr.x, y: curr.y },
      end: {
        x: +(curr.x + (dnx / lenN) * roundN).toFixed(2),
        y: +(curr.y + (dny / lenN) * roundN).toFixed(2),
      },
    });
  }

  let d = `M ${segments[0].start.x},${segments[0].start.y}`;
  for (let i = 0; i < 10; i++) {
    const seg = segments[i];
    d += ` Q ${seg.ctrl.x},${seg.ctrl.y} ${seg.end.x},${seg.end.y}`;
    const nextSeg = segments[(i + 1) % 10];
    d += ` L ${nextSeg.start.x},${nextSeg.start.y}`;
  }
  d += ' Z';
  return d;
}

const LANDING_STAR_VIEWBOX = { width: 800, height: 640 } as const;
const LANDING_STAR_CX = 400;
const LANDING_STAR_CY = 320;

// Estrela Externa ampliada para maior presença (~195px)
const LANDING_STAR_OUTER_R = 195;
const LANDING_STAR_OUTER_INNER = 75;

// Estrela Interna discretamente ampliada (~100px)
const LANDING_STAR_INNER_R = 100;
const LANDING_STAR_INNER_INNER = 39;

// Posições radiais com distância confortável das pontas para não ficarem grudadas
const LANDING_STAR_LABEL_RADIUS = LANDING_STAR_OUTER_R + 62; // 257
const LANDING_STAR_GOLD_NUM_RADIUS = LANDING_STAR_OUTER_R + 25; // 220
const LANDING_STAR_RED_NUM_RADIUS = LANDING_STAR_INNER_R + 16; // 116

const LANDING_STAR_LABEL_DX = [0, 8, 8, -8, -8] as const;
const LANDING_STAR_LABEL_DY = [-6, 0, 8, 8, 0] as const;

const LANDING_OUTER_PATH = harmonyStarRoundedPath(
  LANDING_STAR_CX,
  LANDING_STAR_CY,
  LANDING_STAR_OUTER_R,
  LANDING_STAR_OUTER_INNER,
  12,
  7,
);
const LANDING_INNER_PATH = harmonyStarRoundedPath(
  LANDING_STAR_CX,
  LANDING_STAR_CY,
  LANDING_STAR_INNER_R,
  LANDING_STAR_INNER_INNER,
  7,
  4,
);

export interface HarmonyScoreRowProps {
  eyebrow: string;
  nome: string;
  score: number;
  /** Tom do eyebrow — harmonizado usa gray-400 como na landing. */
  eyebrowTone?: 'birth' | 'harmonized';
  className?: string;
  displayScore?: number;
}

/** Alias estável — implementação em {@link ScoreCardRow}. */
export function HarmonyScoreRow(props: HarmonyScoreRowProps) {
  return <ScoreCardRow {...props} />;
}

/** Container empilhado (landing + chat lateral + sugestões). */
export function HarmonyScoreStack({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${landingMockupFloatClass} p-4 sm:p-5 w-full ${className}`}>
      <div className="flex flex-col gap-4 min-w-0 w-full">{children}</div>
    </div>
  );
}

export function HarmonyScoreDivider() {
  return <div className="border-t border-white/10" aria-hidden />;
}

/**
 * Card de Score (Antes × Depois) da Seção "A Harmonização".
 * Ocupa a largura total da coluna esquerda com barras de progresso contínuas,
 * pontuações calibradas (46 vs 83) e a linguagem oficial Score v3 / Hero.
 */
export function ProductHarmonyScoreCard({ play }: { play?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [internalPlay, setInternalPlay] = useState(false);
  const [birthScore, setBirthScore] = useState(0);
  const [harmScore, setHarmScore] = useState(0);

  const shouldPlay = play ?? internalPlay;

  useEffect(() => {
    if (play !== undefined) {
      setInternalPlay(play);
      return;
    }

    const el = rootRef.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      setInternalPlay(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.setTimeout(() => setInternalPlay(true), 80);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '60px 0px 0px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [play]);

  // Contagem animada suave para ambas as notas
  useEffect(() => {
    if (!shouldPlay) {
      setBirthScore(0);
      setHarmScore(0);
      return;
    }

    if (prefersReducedMotion()) {
      setBirthScore(DEMO_SCORE_BIRTH);
      setHarmScore(DEMO_SCORE_HARMONIZED);
      return;
    }

    const duration = 800;
    const startTime = performance.now();

    let rafId: number;
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 2);

      setBirthScore(Math.round(DEMO_SCORE_BIRTH * ease));

      // Inicia a nota harmonizada com 150ms de defasagem (stagger)
      const harmProgress = Math.max(0, Math.min((elapsed - 150) / duration, 1));
      const harmEase = 1 - Math.pow(1 - harmProgress, 2);
      setHarmScore(Math.round(DEMO_SCORE_HARMONIZED * harmEase));

      if (progress < 1 || harmProgress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [shouldPlay]);

  return (
    <section ref={rootRef} className="w-full">
      <HarmonyScoreStack>
        <HarmonyScoreRow
          eyebrow="Nome de nascimento (Nota Hoje)"
          nome={BIRTH_NAME}
          score={birthScore}
        />
        <HarmonyScoreDivider />
        <HarmonyScoreRow
          eyebrow="Nome harmonizado (Potencial)"
          nome={INDICATED_NAME}
          score={harmScore}
          eyebrowTone="harmonized"
        />
      </HarmonyScoreStack>
    </section>
  );
}

export type HarmonyStarVariant = 'demo' | 'birth-only' | 'dual';

export interface ProductHarmonyStarProps {
  play?: boolean;
  variant?: HarmonyStarVariant;
  birthName?: string;
  birthScore?: number;
  birthNums?: number[];
  harmonizedName?: string;
  harmonizedScore?: number;
  harmonizedNums?: number[];
}

/** Ordem: Destino, Expressão, Motivação, Missão, Impressão. */
export function harmonyStarNumsFromPanel(panel: {
  destino: number;
  expressao: number;
  motivacao: number;
  potencial: number;
  impressao: number;
}): number[] {
  return [panel.destino, panel.expressao, panel.motivacao, panel.potencial, panel.impressao];
}

/**
 * Estrela da Harmonização (SVG Direto no Background).
 * Renderizada sozinha com legenda no lado direito da seção, sem card/container escuro fechado.
 * Suporta animação fluida de entrada quando acionada pelo scroll (play).
 */
export function ProductHarmonyStar({
  play,
  variant: variantProp,
  birthName: birthNameProp,
  birthScore: birthScoreProp,
  birthNums: birthNumsProp,
  harmonizedName: harmonizedNameProp,
  harmonizedScore: harmonizedScoreProp,
  harmonizedNums: harmonizedNumsProp,
}: ProductHarmonyStarProps = {}) {
  const auraId = useId().replace(/:/g, '');
  const rootRef = useRef<HTMLDivElement>(null);
  const [internalPlay, setInternalPlay] = useState(false);
  const [instant, setInstant] = useState(false);

  const variant: HarmonyStarVariant =
    variantProp ??
    (birthNameProp
      ? harmonizedNameProp
        ? 'dual'
        : 'birth-only'
      : 'demo');

  const isDemo = variant === 'demo';
  const isDual = variant === 'dual';
  const isBirthOnly = variant === 'birth-only';

  const birthName = isDemo ? BIRTH_NAME : (birthNameProp ?? '');
  const harmonizedName = isDemo ? INDICATED_NAME : (harmonizedNameProp ?? '');
  const birthScore = isDemo ? DEMO_SCORE_BIRTH : (birthScoreProp ?? 0);
  const harmonizedScore = isDemo ? DEMO_SCORE_HARMONIZED : (harmonizedScoreProp ?? 0);
  const birthNums = isDemo ? DEMO_RED_NUMS : (birthNumsProp ?? [0, 0, 0, 0, 0]);
  const harmonizedNums = isDemo ? DEMO_GOLD_NUMS : (harmonizedNumsProp ?? [0, 0, 0, 0, 0]);

  const birthVisual = getScoreTierVisual(birthScore);
  const harmVisual = getScoreTierVisual(isBirthOnly ? birthScore : harmonizedScore);

  const outerStrokeVisual = isBirthOnly ? birthVisual : harmVisual;
  const outerNums = isBirthOnly ? birthNums : harmonizedNums;

  useEffect(() => {
    if (!isDemo) {
      setInstant(true);
      setInternalPlay(play ?? true);
      return;
    }

    if (play !== undefined) {
      setInternalPlay(play);
      return;
    }

    const el = rootRef.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      setInstant(true);
      setInternalPlay(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInternalPlay(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [play, isDemo]);

  const shouldPlay = isDemo ? (play ?? internalPlay) : (play ?? true);

  return (
    <div ref={rootRef} className="w-full min-w-0 flex flex-col items-center justify-center">
      <div className="harmony-star-wrap w-full">
        <svg
          className="harmony-star-svg w-full overflow-visible"
          viewBox={`0 0 ${LANDING_STAR_VIEWBOX.width} ${LANDING_STAR_VIEWBOX.height}`}
          role="img"
          aria-label="Estrela comparativa entre nome de nascimento e nome harmonizado"
        >
          <defs>
            <radialGradient id={`harmony-star-aura-${auraId}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#84CC16" stopOpacity="0.12" />
              <stop offset="40%" stopColor="#F97316" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#111111" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle
            cx={LANDING_STAR_CX}
            cy={LANDING_STAR_CY}
            r={280}
            fill={`url(#harmony-star-aura-${auraId})`}
            style={{
              opacity: shouldPlay ? 1 : 0,
              transition: instant ? 'none' : 'opacity 1200ms ease-out 700ms',
            }}
            className="pointer-events-none"
          />

          <path
            d={LANDING_OUTER_PATH}
            pathLength={1}
            fill={outerStrokeVisual.stroke}
            fillOpacity={shouldPlay ? 0.12 : 0}
            stroke={outerStrokeVisual.stroke}
            strokeWidth={2.2}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={isDemo ? 1 : 0}
            strokeDashoffset={shouldPlay || !isDemo ? 0 : 1}
            style={{
              opacity: shouldPlay ? 1 : 0,
              transition: instant
                ? 'none'
                : 'stroke-dashoffset 1300ms cubic-bezier(0.22,1,0.36,1) 0ms, fill-opacity 1000ms ease-out 900ms, opacity 120ms linear 0ms',
            }}
          />

          {(isDemo || isDual) && (
            <path
              d={LANDING_INNER_PATH}
              pathLength={1}
              fill={birthVisual.stroke}
              fillOpacity={shouldPlay ? 0.14 : 0}
              stroke={birthVisual.stroke}
              strokeWidth={1.8}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={isDemo ? 1 : 0}
              strokeDashoffset={shouldPlay || !isDemo ? 0 : 1}
              style={{
                opacity: shouldPlay ? 1 : 0,
                transition: instant
                  ? 'none'
                  : 'stroke-dashoffset 1100ms cubic-bezier(0.22,1,0.36,1) 250ms, fill-opacity 1000ms ease-out 1000ms, opacity 120ms linear 250ms',
              }}
            />
          )}

          {HARMONY_STAR_TIP_LABELS.map((label, i) => {
            const labelPos = harmonyStarTipXY(
              LANDING_STAR_CX,
              LANDING_STAR_CY,
              LANDING_STAR_LABEL_RADIUS,
              i,
            );
            const outerNumPos = harmonyStarTipXY(
              LANDING_STAR_CX,
              LANDING_STAR_CY,
              LANDING_STAR_GOLD_NUM_RADIUS,
              i,
            );
            const innerNumPos = harmonyStarTipXY(
              LANDING_STAR_CX,
              LANDING_STAR_CY,
              LANDING_STAR_RED_NUM_RADIUS,
              i,
            );
            return (
              <g
                key={label}
                style={{
                  opacity: shouldPlay ? 1 : 0,
                  transform: shouldPlay ? 'translateY(0px)' : 'translateY(10px)',
                  transition: instant
                    ? 'none'
                    : `opacity 700ms cubic-bezier(0.16,1,0.3,1) ${1000 + i * 110}ms, transform 700ms cubic-bezier(0.16,1,0.3,1) ${1000 + i * 110}ms`,
                }}
              >
                <text
                  className="harmony-star-label"
                  x={labelPos.x + LANDING_STAR_LABEL_DX[i]}
                  y={labelPos.y + LANDING_STAR_LABEL_DY[i]}
                  fill="#d0d5de"
                  fontFamily="Inter, sans-serif"
                  fontSize={21}
                  fontWeight={600}
                  textAnchor={HARMONY_STAR_LABEL_ANCHORS[i]}
                  dominantBaseline="central"
                >
                  {label}
                </text>

                <text
                  className="harmony-star-num-outer"
                  x={outerNumPos.x}
                  y={outerNumPos.y}
                  fill={outerStrokeVisual.text}
                  fontFamily="Inter, sans-serif"
                  fontSize={24}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {outerNums[i]}
                </text>

                {(isDemo || isDual) && (
                  <text
                    className="harmony-star-num-inner"
                    x={innerNumPos.x}
                    y={innerNumPos.y}
                    fill={birthVisual.text}
                    fontFamily="Inter, sans-serif"
                    fontSize={20}
                    fontWeight={700}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {birthNums[i]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div
        style={{
          transitionDelay: shouldPlay && !instant ? '1700ms' : '0ms',
        }}
        className={`flex flex-col sm:flex-row justify-center items-center gap-2.5 sm:gap-6 text-[13px] sm:text-sm text-gray-400 mt-8 sm:mt-10 px-2 transition-all duration-700 ease-out ${
          shouldPlay ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <span className="inline-flex items-center gap-2 min-w-0 justify-center sm:justify-start">
          <span
            className="inline-block w-3 h-3 rounded-full shrink-0"
            style={{
              borderColor: birthVisual.stroke,
              borderWidth: 1.5,
              borderStyle: 'solid',
              background: birthVisual.dotBg,
            }}
            aria-hidden="true"
          />
          <span className="truncate text-[#e5e2e1] font-medium">{birthName}</span>
        </span>
        {(isDemo || isDual) && harmonizedName && (
          <span className="inline-flex items-center gap-2 min-w-0 justify-center sm:justify-start">
            <span
              className="inline-block w-3 h-3 rounded-full shrink-0"
              style={{
                borderColor: harmVisual.stroke,
                borderWidth: 1.5,
                borderStyle: 'solid',
                background: harmVisual.dotBg,
              }}
              aria-hidden="true"
            />
            <span className="truncate font-medium text-[#e5e2e1]">{harmonizedName}</span>
          </span>
        )}
      </div>

      <style>{`
        .harmony-star-wrap {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          max-width: 100%;
          overflow: visible;
          padding: 0.5rem;
        }
        .harmony-star-svg {
          width: 100%;
          max-width: 580px;
          height: auto;
          display: block;
          overflow: visible;
        }
        .harmony-star-label {
          fill: #d0d5de;
          font-size: 21px;
          font-weight: 600;
        }
        .harmony-star-num-outer {
          font-size: 24px;
          font-weight: 700;
        }
        .harmony-star-num-inner {
          font-size: 20px;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}

/**
 * Card Fixo da Seção "A Harmonização" (composição legada para retrocompatibilidade)
 */
export function ProductHarmonyFrame() {
  return (
    <div className={`@container/harmony ${desktopFitClass}`}>
      <div className={desktopStackClass}>
        <ProductHarmonyScoreCard />
        <ProductHarmonyStar />
      </div>
    </div>
  );
}

/**
 * Card Fixo da Seção "As Sugestões"
 * No outer dark tray — headings sit on page ground; suggestion tiles float.
 */
export function ProductSuggestionsFrame() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [stagger, setStagger] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      setStagger(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.setTimeout(() => setStagger(true), 60);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '60px 0px 0px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={`@container/suggestions ${desktopFitClass}`}>
      <div className="w-full min-w-0 flex flex-col gap-3 sm:gap-3.5">
        {DEMO_SYSTEM_SUGGESTIONS.map((c, index) => (
          <HarmonySuggestionCard
            key={c.nome}
            c={c}
            stagger={stagger}
            delayIndex={index}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Compatibilidade legada caso algum outro componente ainda faça referência a ProductResultFrame.
 */
export function ProductResultFrame() {
  return <ProductHarmonyFrame />;
}
