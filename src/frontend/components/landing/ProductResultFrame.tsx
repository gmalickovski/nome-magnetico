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
import { ProductAnimatedScore } from './ProductAnimatedScore';

const GOLD = '#D4AF37';

/** Demo pairing validated against analisarNomeSocial("Maria da Silva Santos", "26/05/1971"). */
const BIRTH_NAME = 'MARIA DA SILVA SANTOS';
const INDICATED_NAME = 'MARIÃ SILVA';
const BIRTH_DATE = '26 de maio de 1971';
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

/** Soft crossfade shared by Harmonização ↔ Sugestões (both directions). */
const PANEL_FADE_MS = 1100;
// Static class string so Tailwind JIT emits the duration utility.
const PANEL_EASE = 'duration-[1100ms] ease-[cubic-bezier(0.33,1,0.32,1)]';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function panelShellClass(active: boolean) {
  const z = active ? 'z-20' : 'z-10';
  // Subtle lift only — mostly opacity so the swap feels fluid, not jumpy.
  const motion = active
    ? 'opacity-100 translate-y-0 scale-100'
    : 'opacity-0 translate-y-1.5 scale-[0.992] pointer-events-none';
  return `col-start-1 row-start-1 w-full min-w-0 transition-[opacity,transform] ${PANEL_EASE} motion-reduce:transition-none ${z} ${motion}`;
}

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
      className={`rounded-2xl bg-white/5 p-2.5 sm:p-3 flex flex-col gap-1.5 sm:gap-2 min-w-0 transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.33,1,0.32,1)] ${
        stagger ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5'
      }`}
      style={{ transitionDelay: stagger ? `${delayIndex * 70}ms` : '0ms' }}
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
      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] sm:text-[11px] text-gray-500">
        <span>
          Expr: <span className="text-gray-300">{c.expressao}</span>
        </span>
        <span>
          Dest: <span className="text-[#D4AF37] font-semibold">{c.destino}</span>
        </span>
        <span>
          Mot: <span className="text-gray-300">{c.motivacao}</span>
        </span>
        <span>
          Imp: <span className="text-gray-300">{c.impressao}</span>
        </span>
        <span>
          Mis: <span className="text-gray-300">{c.missao}</span>
        </span>
      </div>
      {c.bloqueios > 0 ? (
        <span className="text-[11px] text-red-400">⚠ {c.bloqueios} bloqueio(s)</span>
      ) : (
        <span className="text-[11px] text-emerald-400">✓ Sem bloqueios</span>
      )}
    </div>
  );
}

function HarmonyPanel({
  active,
  scoresPlay,
  cycle,
}: {
  active: boolean;
  scoresPlay: boolean;
  cycle: number;
}) {
  return (
    <div
      className={panelShellClass(active)}
      aria-hidden={!active}
    >
      <section className="rounded-2xl bg-white/5 p-3 sm:p-5 mb-5 overflow-hidden min-w-0">
        <p className="font-cinzel text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#76746a] mb-4 break-words">
          Análise de Nome Social — Certificado Cabalístico
        </p>

        <div className="flex flex-col gap-5 min-w-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between min-w-0">
            <div className="min-w-0 flex-1">
              <p className="font-cinzel text-[10px] uppercase tracking-[0.14em] text-[#76746a] mb-1">
                Nome de nascimento
              </p>
              <h3 className="font-cinzel text-lg sm:text-xl md:text-2xl font-bold text-[#e5e2e1] mb-1 break-words">
                {BIRTH_NAME}
              </h3>
              <p className="text-gray-500 text-xs mt-1">{BIRTH_DATE}</p>
            </div>
            <div className="w-full md:w-40 lg:w-44 md:shrink-0 min-w-0">
              <ProductAnimatedScore
                key={`birth-${cycle}`}
                score={DEMO_SCORE_BIRTH}
                play={scoresPlay}
                size="lg"
                delayMs={0}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between pt-5 border-t border-white/10 min-w-0">
            <div className="min-w-0 flex-1">
              <p className="font-cinzel text-[10px] uppercase tracking-[0.14em] text-[#D4AF37]/70 mb-1">
                Nome harmonizado
              </p>
              <h3 className="font-cinzel text-lg sm:text-xl md:text-2xl font-bold text-[#e5e2e1] mb-1 break-words">
                {INDICATED_NAME}
              </h3>
            </div>
            <div className="w-full md:w-40 lg:w-44 md:shrink-0 min-w-0">
              <ProductAnimatedScore
                key={`harm-${cycle}`}
                score={DEMO_SCORE_HARMONIZED}
                play={scoresPlay}
                size="lg"
                delayMs={450}
              />
            </div>
          </div>
        </div>
      </section>

      <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-2 px-0.5">
        A Transformação
      </p>
      <h4 className="font-cinzel text-xl sm:text-2xl font-bold text-[#e5e2e1] px-0.5 mb-3">
        A Harmonização
      </h4>

      <div className="harmony-star-wrap mb-4">
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
                  fill="#b0b7c3"
                  fontFamily="Inter, sans-serif"
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

      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-8 text-xs text-gray-400 px-0.5">
        <span className="inline-flex items-center gap-2 min-w-0 justify-center sm:justify-start">
          <span
            className="inline-block w-3 h-3 rounded-full shrink-0 border border-red-500"
            style={{ background: 'rgba(220,38,38,0.25)' }}
            aria-hidden="true"
          />
          <span className="truncate">{BIRTH_NAME}</span>
        </span>
        <span className="inline-flex items-center gap-2 min-w-0 justify-center sm:justify-start">
          <span
            className="inline-block w-3 h-3 rounded-full shrink-0 border border-[#D4AF37]"
            style={{ background: 'rgba(212,175,55,0.2)' }}
            aria-hidden="true"
          />
          <span className="truncate font-medium text-[#D4AF37]">{INDICATED_NAME}</span>
        </span>
      </div>
    </div>
  );
}

function SuggestionsPanel({
  active,
  stagger,
  cycle,
}: {
  active: boolean;
  stagger: boolean;
  cycle: number;
}) {
  return (
    <div
      className={panelShellClass(active)}
      aria-hidden={!active}
    >
      <div className="flex flex-col gap-5 sm:gap-6 min-w-0 h-full">
        <div className="min-w-0">
          <p className="font-cinzel text-[10px] sm:text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-1 px-0.5">
            Selecionadas para Você
          </p>
          <h4 className="font-cinzel text-lg sm:text-xl font-bold text-[#e5e2e1] px-0.5 mb-1">
            Nossas Sugestões
          </h4>
          <p className="text-[11px] sm:text-xs text-gray-400 px-0.5 mb-3 leading-relaxed">
            Criadas para o seu perfil numerológico.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {DEMO_SYSTEM_SUGGESTIONS.map((c, index) => (
              <SuggestionCard
                key={`${c.nome}-${cycle}`}
                c={c}
                stagger={stagger}
                delayIndex={index}
              />
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <p className="font-cinzel text-[10px] sm:text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-1 px-0.5">
            Seus Candidatos
          </p>
          <h4 className="font-cinzel text-lg sm:text-xl font-bold text-[#e5e2e1] px-0.5 mb-1">
            Suas Sugestões
          </h4>
          <p className="text-[11px] sm:text-xs text-gray-400 px-0.5 mb-3 leading-relaxed">
            Nomes que você indicou, analisados numerologicamente.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {DEMO_USER_SUGGESTIONS.map((c, index) => (
              <SuggestionCard
                key={`${c.nome}-${cycle}`}
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
 * Animated preview: certificate → scores → soft crossfade to suggestions → loop back with the same fade.
 */
export function ProductResultFrame() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState<'harmony' | 'suggestions'>('harmony');
  const [scoresPlay, setScoresPlay] = useState(false);
  const [suggestionsStagger, setSuggestionsStagger] = useState(false);
  const [cycle, setCycle] = useState(0);
  const timersRef = useRef<number[]>([]);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const clearTimers = () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };

    const schedule = (fn: () => void, ms: number) => {
      timersRef.current.push(window.setTimeout(fn, ms));
    };

    const SCORE_AT = 520;
    const TO_SUGGESTIONS_AT = 7200;
    const HOLD_SUGGESTIONS_MS = 8800;
    const STAGGER_AFTER_FADE = 180;
    const LOOP_MS = TO_SUGGESTIONS_AT + PANEL_FADE_MS + HOLD_SUGGESTIONS_MS;

    const playHarmonyCycle = (nextCycle: number) => {
      clearTimers();
      setCycle(nextCycle);
      setPanel('harmony');
      setScoresPlay(false);

      schedule(() => setScoresPlay(true), SCORE_AT);

      schedule(() => {
        // Soft outbound: final scores stay painted while the panel fades.
        setPanel('suggestions');
        schedule(() => setSuggestionsStagger(true), STAGGER_AFTER_FADE);
      }, TO_SUGGESTIONS_AT);

      schedule(() => {
        // Soft return — same easing. Reset scores while harmony is still
        // hidden; keep suggestion keys stable so cards don't remount mid-fade.
        setScoresPlay(false);
        setPanel('harmony');
        schedule(() => {
          setSuggestionsStagger(false);
          playHarmonyCycle(nextCycle + 1);
        }, PANEL_FADE_MS);
      }, LOOP_MS);
    };

    const runSequence = () => {
      clearTimers();

      if (prefersReducedMotion()) {
        setPanel('suggestions');
        setSuggestionsStagger(true);
        setScoresPlay(true);
        return;
      }

      playHarmonyCycle(0);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          runSequence();
          observer.disconnect();
        }
      },
      { threshold: 0.28 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimers();
    };
  }, []);

  const harmonyActive = panel === 'harmony';
  const suggestionsActive = panel === 'suggestions';

  return (
    <div
      ref={rootRef}
      className="rounded-2xl bg-[#131313] px-3 py-5 sm:px-5 sm:py-7 min-w-0 relative overflow-hidden"
    >
      <div className="relative grid min-w-0">
        <HarmonyPanel active={harmonyActive} scoresPlay={scoresPlay} cycle={cycle} />
        <SuggestionsPanel
          active={suggestionsActive}
          stagger={suggestionsStagger}
          cycle={cycle}
        />
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
          max-width: 660px;
          height: auto;
          display: block;
        }
        .harmony-star-label {
          fill: #b0b7c3;
          font-size: 13px;
        }
        .harmony-star-num-gold {
          font-size: 17px;
        }
        .harmony-star-num-red {
          font-size: 14px;
        }
        @media (min-width: 640px) {
          .harmony-star-label {
            font-size: 13px;
          }
          .harmony-star-num-gold {
            font-size: 18px;
          }
          .harmony-star-num-red {
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
}
