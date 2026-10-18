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

/** Demo pairing validated against analisarNomeSocial("Maria da Silva Santos", "26/05/1971"). */
const BIRTH_NAME = 'MARIA DA SILVA SANTOS';
const INDICATED_NAME = 'MARIÃ SILVA';
const DEMO_SCORE_BIRTH = 0;
const DEMO_SCORE_HARMONIZED = 83;

const DEMO_GOLD_NUMS = [4, 8, 8, 3, 9];
const DEMO_RED_NUMS = [4, 6, 5, 1, 1];

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
    nome: 'MARIA DA SANNTOS',
    score: 84,
    compatibilidade: 'favoravel',
    expressao: 9,
    destino: 4,
    motivacao: 5,
    impressao: 4,
    missao: 4,
    bloqueios: 0,
  },
  {
    nome: 'MARIÃ SILVA',
    score: 83,
    compatibilidade: 'favoravel',
    expressao: 8,
    destino: 4,
    motivacao: 8,
    impressao: 9,
    missao: 3,
    bloqueios: 0,
  },
  {
    nome: 'MARIA SILVA',
    score: 84,
    compatibilidade: 'favoravel',
    expressao: 9,
    destino: 4,
    motivacao: 6,
    impressao: 3,
    missao: 4,
    bloqueios: 0,
  },
];

/** User candidates — mirrors "Suas Sugestões". */
const DEMO_USER_SUGGESTIONS: DemoSuggestion[] = [
  {
    nome: 'MARIA SANTOS',
    score: 57,
    compatibilidade: 'desfavoravel',
    expressao: 5,
    destino: 4,
    motivacao: 11,
    impressao: 3,
    missao: 9,
    bloqueios: 0,
  },
  {
    nome: 'MARIA DA SILVA',
    score: 6,
    compatibilidade: 'neutro',
    expressao: 1,
    destino: 4,
    motivacao: 6,
    impressao: 4,
    missao: 5,
    bloqueios: 4,
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

/** Stack gap leaves room for the shared multi-layer float shadow between cards. */
const desktopStackClass = 'w-full min-w-0 flex flex-col gap-5 sm:gap-6';

/**
 * Floating suggestion tile with multi-layer 3D shadow and smooth stagger reveal.
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
      className={`${landingMockupTileClass} p-3.5 sm:p-4 flex flex-col gap-2 min-w-0 h-full transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        stagger ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
      style={{ transitionDelay: stagger ? `${delayIndex * 80}ms` : '0ms' }}
    >
      <div className="font-cinzel text-sm sm:text-base font-bold text-[#e5e2e1] break-words leading-tight">
        {c.nome}
      </div>
      <ProductAnimatedScore
        score={c.score}
        play={stagger}
        size="sm"
        delayMs={stagger ? delayIndex * 80 : 0}
      />
      <CompatibilityBadge compatibilidade={c.compatibilidade} size="sm" />
      <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[11px] text-gray-400">
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
        <span className="text-[11px] font-medium text-red-400 whitespace-nowrap">⚠ {c.bloqueios} bloqueio(s)</span>
      ) : (
        <span className="text-[11px] font-medium text-emerald-400 whitespace-nowrap">✓ Sem bloqueios</span>
      )}
    </div>
  );
}

/**
 * Card Fixo da Seção "A Harmonização"
 * Individual floating cards with multi-layer realistic 3D elevation.
 */
export function ProductHarmonyFrame() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scoresPlay, setScoresPlay] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      setScoresPlay(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.setTimeout(() => setScoresPlay(true), 80);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '60px 0px 0px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={`@container/harmony ${desktopFitClass}`}>
      <div className={desktopStackClass}>
        {/* Certificate — floats alone on the page ground */}
        <section className={`${landingMockupFloatClass} p-5 sm:p-6`}>
          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex flex-col gap-2.5 @[420px]/harmony:flex-row @[420px]/harmony:items-start @[420px]/harmony:justify-between min-w-0">
              <div className="min-w-0 flex-1">
                <p className="font-cinzel text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#76746a] mb-1">
                  Nome de nascimento
                </p>
                <h3 className="font-cinzel text-base sm:text-lg @[520px]/harmony:text-xl font-bold text-[#e5e2e1] break-words leading-snug">
                  {BIRTH_NAME}
                </h3>
              </div>
              <div className="w-full @[420px]/harmony:w-40 @[560px]/harmony:w-44 @[420px]/harmony:shrink-0 min-w-0">
                <ProductAnimatedScore
                  score={DEMO_SCORE_BIRTH}
                  play={scoresPlay}
                  size="lg"
                  delayMs={0}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2.5 @[420px]/harmony:flex-row @[420px]/harmony:items-start @[420px]/harmony:justify-between pt-4 border-t border-white/10 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="font-cinzel text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#D4AF37]/80 mb-1">
                  Nome harmonizado
                </p>
                <h3 className="font-cinzel text-base sm:text-lg @[520px]/harmony:text-xl font-bold text-[#e5e2e1] break-words leading-snug">
                  {INDICATED_NAME}
                </h3>
              </div>
              <div className="w-full @[420px]/harmony:w-40 @[560px]/harmony:w-44 @[420px]/harmony:shrink-0 min-w-0">
                <ProductAnimatedScore
                  score={DEMO_SCORE_HARMONIZED}
                  play={scoresPlay}
                  size="lg"
                  delayMs={280}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Star comparison — second floating surface, no outer tray */}
        <section className={`${landingMockupFloatClass} p-5 sm:p-6`}>
          <div className="harmony-star-wrap mb-2.5">
            <svg
              className="harmony-star-svg w-full"
              viewBox={`0 0 ${HARMONY_STAR_VIEWBOX.width} ${HARMONY_STAR_VIEWBOX.height}`}
              role="img"
              aria-label="Estrela comparativa entre nome de nascimento e nome harmonizado"
            >
              <polygon
                points={OUTER_PTS}
                fill={GOLD}
                fillOpacity={0.1}
                stroke={GOLD}
                strokeWidth={2}
              />
              <polygon
                points={INNER_PTS}
                fill="#DC2626"
                fillOpacity={0.12}
                stroke="#DC2626"
                strokeWidth={1.5}
              />
              {HARMONY_STAR_TIP_LABELS.map((label, i) => {
                const labelPos = harmonyStarTipXY(
                  HARMONY_STAR_CX,
                  HARMONY_STAR_CY,
                  HARMONY_STAR_LABEL_RADIUS,
                  i,
                );
                const goldPos = harmonyStarTipXY(
                  HARMONY_STAR_CX,
                  HARMONY_STAR_CY,
                  HARMONY_STAR_GOLD_NUM_RADIUS,
                  i,
                );
                const redPos = harmonyStarTipXY(
                  HARMONY_STAR_CX,
                  HARMONY_STAR_CY,
                  HARMONY_STAR_RED_NUM_RADIUS,
                  i,
                );
                return (
                  <g key={label}>
                    <text
                      className="harmony-star-label"
                      x={labelPos.x + HARMONY_STAR_LABEL_DX[i]}
                      y={labelPos.y + HARMONY_STAR_LABEL_DY[i]}
                      fill="#d0d5de"
                      fontFamily="Inter, sans-serif"
                      fontSize={19}
                      fontWeight={600}
                      textAnchor={HARMONY_STAR_LABEL_ANCHORS[i]}
                    >
                      {label}
                    </text>
                    <text
                      className="harmony-star-num-gold"
                      x={goldPos.x}
                      y={goldPos.y + 6}
                      fill={GOLD}
                      fontFamily="Inter, sans-serif"
                      fontSize={24}
                      fontWeight={700}
                      textAnchor="middle"
                    >
                      {DEMO_GOLD_NUMS[i]}
                    </text>
                    <text
                      className="harmony-star-num-red"
                      x={redPos.x}
                      y={redPos.y + 5}
                      fill="#DC2626"
                      fontFamily="Inter, sans-serif"
                      fontSize={14}
                      fontWeight={700}
                      textAnchor="middle"
                    >
                      {DEMO_RED_NUMS[i]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-6 text-[11px] text-gray-400 px-0.5">
            <span className="inline-flex items-center gap-2 min-w-0 justify-center sm:justify-start">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0 border border-red-500"
                style={{ background: 'rgba(220,38,38,0.25)' }}
                aria-hidden="true"
              />
              <span className="truncate">{BIRTH_NAME}</span>
            </span>
            <span className="inline-flex items-center gap-2 min-w-0 justify-center sm:justify-start">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0 border border-[#D4AF37]"
                style={{ background: 'rgba(212,175,55,0.2)' }}
                aria-hidden="true"
              />
              <span className="truncate font-medium text-[#D4AF37]">{INDICATED_NAME}</span>
            </span>
          </div>
        </section>
      </div>

      <style>{`
        .harmony-star-wrap {
          display: flex;
          justify-content: center;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          padding-inline: 0.125rem;
        }
        .harmony-star-svg {
          width: 100%;
          max-width: min(100%, 420px);
          height: auto;
          display: block;
        }
        /* Sized up so tip words stay legible after desktop mockup zoom. */
        .harmony-star-label {
          fill: #d0d5de;
          font-size: 17px;
          font-weight: 600;
        }
        .harmony-star-num-gold {
          font-size: 22px;
        }
        .harmony-star-num-red {
          font-size: 13px;
        }
        @container harmony (min-width: 480px) {
          .harmony-star-svg {
            max-width: min(100%, 460px);
          }
          .harmony-star-label {
            font-size: 19px;
            font-weight: 600;
          }
          .harmony-star-num-gold {
            font-size: 24px;
          }
          .harmony-star-num-red {
            font-size: 14px;
          }
        }
      `}</style>
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
      <div className={`${desktopStackClass} gap-6`}>
        <div className="min-w-0">
          <p className="font-cinzel text-[10px] sm:text-xs uppercase tracking-[0.15em] text-[#D4AF37]/80 mb-1 px-0.5">
            Selecionadas para Você
          </p>
          <h4 className="font-cinzel text-lg sm:text-xl font-bold text-[#e5e2e1] px-0.5 mb-0.5">
            Nossas Sugestões
          </h4>
          <p className="text-[11px] sm:text-xs text-gray-400 px-0.5 mb-3.5 leading-relaxed">
            Criadas para o seu perfil numerológico.
          </p>
          {/* 3-up from sm, 1-up on mobile. Gap leaves room for multi-layer float shadows. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        <div className="min-w-0">
          <p className="font-cinzel text-[10px] sm:text-xs uppercase tracking-[0.15em] text-[#D4AF37]/80 mb-1 px-0.5">
            Seus Candidatos
          </p>
          <h4 className="font-cinzel text-lg sm:text-xl font-bold text-[#e5e2e1] px-0.5 mb-0.5">
            Suas Sugestões
          </h4>
          <p className="text-[11px] sm:text-xs text-gray-400 px-0.5 mb-3.5 leading-relaxed">
            Nomes que você indicou, analisados numerologicamente.
          </p>
          {/* 2-up from sm (two candidates), 1-up on mobile. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEMO_USER_SUGGESTIONS.map((c, index) => (
              <SuggestionCard
                key={c.nome}
                c={c}
                stagger={stagger}
                delayIndex={DEMO_SYSTEM_SUGGESTIONS.length + index}
              />
            ))}
          </div>
        </div>
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
