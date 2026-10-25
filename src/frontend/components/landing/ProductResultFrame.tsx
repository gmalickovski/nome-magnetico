import React, { useEffect, useRef, useState } from 'react';
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
import { ProductAnimatedScore } from './ProductAnimatedScore';

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

interface DemoSuggestion {
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
function SuggestionCard({
  c,
  stagger,
  delayIndex,
}: {
  c: DemoSuggestion;
  stagger: boolean;
  delayIndex: number;
}) {
  return (
    <div
      className={`${landingMockupTileClass} px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col gap-2 min-w-0 w-full transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        stagger ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: stagger ? `${delayIndex * 80}ms` : '0ms' }}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="font-cinzel text-sm sm:text-base font-bold text-[#e5e2e1] whitespace-normal [overflow-wrap:normal] [word-break:normal] [hyphens:none] leading-tight">
          {c.nome}
        </div>
        <CompatibilityBadge compatibilidade={c.compatibilidade} size="sm" />
      </div>

      <ProductAnimatedScore
        score={c.score}
        play={stagger}
        size="sm"
        delayMs={stagger ? delayIndex * 80 : 0}
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

export interface ScoreTierVisual {
  code: 'N1' | 'N2' | 'N3' | 'N4' | 'N5';
  label: string;
  stroke: string;
  text: string;
  fill: string;
  dotBg: string;
  badgeClass: string;
  barGradient: string;
}

export function getScoreTierVisual(score: number): ScoreTierVisual {
  const s = Math.max(0, Math.min(100, score));
  if (s >= 85) {
    return {
      code: 'N5',
      label: 'Harmonioso',
      stroke: '#10B981',
      text: '#34D399',
      fill: 'rgba(16, 185, 129, 0.12)',
      dotBg: 'rgba(16, 185, 129, 0.25)',
      badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      barGradient: 'from-emerald-500 to-emerald-400',
    };
  }
  if (s >= 70) {
    return {
      code: 'N4',
      label: 'Favorável',
      stroke: '#84CC16',
      text: '#A3E635',
      fill: 'rgba(132, 204, 22, 0.12)',
      dotBg: 'rgba(132, 204, 22, 0.25)',
      badgeClass: 'bg-lime-500/10 border-lime-500/30 text-lime-400',
      barGradient: 'from-lime-500 to-lime-400',
    };
  }
  if (s >= 50) {
    return {
      code: 'N3',
      label: 'Equilíbrio Parcial',
      stroke: '#EAB308',
      text: '#FACC15',
      fill: 'rgba(234, 179, 8, 0.12)',
      dotBg: 'rgba(234, 179, 8, 0.25)',
      badgeClass: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      barGradient: 'from-yellow-500 to-yellow-400',
    };
  }
  if (s >= 30) {
    return {
      code: 'N2',
      label: 'Pede Atenção',
      stroke: '#F97316',
      text: '#FB923C',
      fill: 'rgba(249, 115, 22, 0.12)',
      dotBg: 'rgba(249, 115, 22, 0.25)',
      badgeClass: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      barGradient: 'from-orange-600 to-orange-400',
    };
  }
  return {
    code: 'N1',
    label: 'Em Tensão',
    stroke: '#EF4444',
    text: '#F87171',
    fill: 'rgba(239, 68, 68, 0.12)',
    dotBg: 'rgba(239, 68, 68, 0.25)',
    badgeClass: 'bg-red-500/10 border-red-500/30 text-red-400',
    barGradient: 'from-red-600 to-red-500',
  };
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
  const birthVisual = getScoreTierVisual(DEMO_SCORE_BIRTH);
  const harmVisual = getScoreTierVisual(DEMO_SCORE_HARMONIZED);

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
    <section ref={rootRef} className={`${landingMockupFloatClass} p-4 sm:p-5 w-full`}>
      <div className="flex flex-col gap-4 min-w-0 w-full">
        {/* Item 1: Nome de Nascimento (Nota Hoje - N2 · Em Ajuste) */}
        <div className="flex flex-col gap-1.5 min-w-0 w-full">
          <div className="flex items-center justify-between gap-2 min-w-0 w-full">
            <p className="font-cinzel text-[11px] sm:text-xs uppercase tracking-[0.14em] text-gray-500 leading-snug">
              Nome de nascimento (Nota Hoje)
            </p>
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <span
                className="font-cinzel font-bold text-xl sm:text-2xl tabular-nums leading-none"
                style={{ color: birthVisual.text }}
              >
                {birthScore}
                <span className="text-xs font-inter font-normal text-gray-500 ml-0.5">/100</span>
              </span>
              <span className={`text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full ${birthVisual.badgeClass} whitespace-nowrap`}>
                {birthVisual.label}
              </span>
            </div>
          </div>
          <h4 className="w-full font-cinzel text-base sm:text-base md:text-lg font-bold text-[#e5e2e1] leading-snug whitespace-normal [overflow-wrap:normal] [word-break:normal] [hyphens:none]">
            {BIRTH_NAME}
          </h4>
          {/* Barra de progresso full-width */}
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mt-0.5">
            <div
              className={`h-2 rounded-full bg-gradient-to-r ${birthVisual.barGradient} transition-all duration-150`}
              style={{ width: `${birthScore}%` }}
            />
          </div>
        </div>

        {/* Linha divisória sutil */}
        <div className="border-t border-white/10" />

        {/* Item 2: Nome Harmonizado (Potencial - N4 · Alinhado) */}
        <div className="flex flex-col gap-1.5 min-w-0 w-full">
          <div className="flex items-center justify-between gap-2 min-w-0 w-full">
            <p className="font-cinzel text-[11px] sm:text-xs uppercase tracking-[0.14em] text-gray-400 leading-snug">
              Nome harmonizado (Potencial)
            </p>
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <span
                className="font-cinzel font-bold text-xl sm:text-2xl tabular-nums leading-none"
                style={{ color: harmVisual.text }}
              >
                {harmScore}
                <span className="text-xs font-inter font-normal text-gray-500 ml-0.5">/100</span>
              </span>
              <span className={`text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full ${harmVisual.badgeClass} whitespace-nowrap`}>
                {harmVisual.label}
              </span>
            </div>
          </div>
          <h4 className="w-full font-cinzel text-base sm:text-base md:text-lg font-bold text-[#e5e2e1] leading-snug whitespace-normal [overflow-wrap:normal] [word-break:normal] [hyphens:none]">
            {INDICATED_NAME}
          </h4>
          {/* Barra de progresso full-width */}
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mt-0.5">
            <div
              className={`h-2 rounded-full bg-gradient-to-r ${harmVisual.barGradient} transition-all duration-150`}
              style={{ width: `${harmScore}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Estrela da Harmonização (SVG Direto no Background).
 * Renderizada sozinha com legenda no lado direito da seção, sem card/container escuro fechado.
 * Suporta animação fluida de entrada quando acionada pelo scroll (play).
 */
export function ProductHarmonyStar({ play }: { play?: boolean } = {}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [internalPlay, setInternalPlay] = useState(false);
  // Reduced motion: estado final imediato, sem transições (definido após hidratar para evitar mismatch SSR).
  const [instant, setInstant] = useState(false);
  const shouldPlay = play ?? internalPlay;
  const birthVisual = getScoreTierVisual(DEMO_SCORE_BIRTH);
  const harmVisual = getScoreTierVisual(DEMO_SCORE_HARMONIZED);

  useEffect(() => {
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

    // A estrela tem gatilho próprio: no mobile/tablet ela fica abaixo do texto e do card,
    // então só desenha quando uma parte relevante dela está visível (desktop, widescreen e mobile).
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
  }, [play]);

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
            <radialGradient id="harmony-star-aura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#84CC16" stopOpacity="0.12" />
              <stop offset="40%" stopColor="#F97316" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#111111" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Aura Mística ao Fundo (surge depois do traçado das linhas) */}
          <circle
            cx={LANDING_STAR_CX}
            cy={LANDING_STAR_CY}
            r={280}
            fill="url(#harmony-star-aura)"
            style={{
              opacity: shouldPlay ? 1 : 0,
              transition: instant ? 'none' : 'opacity 1200ms ease-out 700ms',
            }}
            className="pointer-events-none"
          />

          {/* Estrela Externa (Harmonizada): linha desenhada progressivamente, depois preenchimento */}
          <path
            d={LANDING_OUTER_PATH}
            pathLength={1}
            fill={harmVisual.stroke}
            fillOpacity={shouldPlay ? 0.12 : 0}
            stroke={harmVisual.stroke}
            strokeWidth={2.2}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={1}
            strokeDashoffset={shouldPlay ? 0 : 1}
            style={{
              opacity: shouldPlay ? 1 : 0,
              transition: instant
                ? 'none'
                : 'stroke-dashoffset 1300ms cubic-bezier(0.22,1,0.36,1) 0ms, fill-opacity 1000ms ease-out 900ms, opacity 120ms linear 0ms',
            }}
          />

          {/* Estrela Interna (Nascimento): traçado com leve defasagem */}
          <path
            d={LANDING_INNER_PATH}
            pathLength={1}
            fill={birthVisual.stroke}
            fillOpacity={shouldPlay ? 0.14 : 0}
            stroke={birthVisual.stroke}
            strokeWidth={1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={1}
            strokeDashoffset={shouldPlay ? 0 : 1}
            style={{
              opacity: shouldPlay ? 1 : 0,
              transition: instant
                ? 'none'
                : 'stroke-dashoffset 1100ms cubic-bezier(0.22,1,0.36,1) 250ms, fill-opacity 1000ms ease-out 1000ms, opacity 120ms linear 250ms',
            }}
          />

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
                {/* Rótulo do Vértice (Destino, Expressão, etc.) */}
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

                {/* Número da Ponta Externa: reflete a cor do score harmonizado */}
                <text
                  className="harmony-star-num-outer"
                  x={outerNumPos.x}
                  y={outerNumPos.y}
                  fill={harmVisual.text}
                  fontFamily="Inter, sans-serif"
                  fontSize={24}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {DEMO_GOLD_NUMS[i]}
                </text>

                {/* Número da Ponta Interna: reflete a cor do score de nascimento */}
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
                  {DEMO_RED_NUMS[i]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legenda comparativa posicionada mais abaixo */}
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
          <span className="truncate text-[#e5e2e1] font-medium">{BIRTH_NAME}</span>
        </span>
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
          <span className="truncate font-medium text-[#e5e2e1]">{INDICATED_NAME}</span>
        </span>
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
          <SuggestionCard
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
