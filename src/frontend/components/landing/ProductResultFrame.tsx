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

/** Grouped demo suggestions — same fields as app result cards. */
const DEMO_SUGGESTIONS: DemoSuggestion[] = [
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

type Phase = 'idle' | 'harmony' | 'scores' | 'suggestions';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function HarmonyPanel({
  visible,
  scoresPlay,
}: {
  visible: boolean;
  scoresPlay: boolean;
}) {
  return (
    <div
      className={`col-start-1 row-start-1 w-full min-w-0 transition-[opacity,transform] duration-[800ms] ease-out ${
        visible
          ? 'opacity-100 translate-y-0 relative z-10'
          : 'opacity-0 translate-y-3 pointer-events-none z-0'
      }`}
      aria-hidden={!visible}
    >
      <section className="rounded-2xl bg-white/5 p-3 sm:p-5 mb-5 overflow-hidden min-w-0">
        <p className="font-cinzel text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#76746a] mb-4 break-words">
          Análise de Nome Social — Certificado Cabalístico
        </p>

        <div className="flex flex-col gap-5 min-w-0">
          {/* Stack name + score on phone; side-by-side only from md up */}
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
              <ProductAnimatedScore score={DEMO_SCORE_BIRTH} play={scoresPlay} size="lg" delayMs={0} />
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
  visible,
  stagger,
}: {
  visible: boolean;
  stagger: boolean;
}) {
  return (
    <div
      className={`col-start-1 row-start-1 w-full min-w-0 transition-[opacity,transform] duration-[800ms] ease-out ${
        visible
          ? 'opacity-100 translate-y-0 relative z-10'
          : 'opacity-0 translate-y-3 pointer-events-none z-0'
      }`}
      aria-hidden={!visible}
    >
      <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-2 px-0.5">
        Comparar e escolher
      </p>
      <h4 className="font-cinzel text-xl sm:text-2xl font-bold text-[#e5e2e1] px-0.5 mb-1">
        Sugestões para testar
      </h4>
      <p className="text-xs text-gray-400 px-0.5 mb-4 leading-relaxed">
        Variações ranqueadas com score, compatibilidade e bloqueios — você escolhe a assinatura.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DEMO_SUGGESTIONS.map((c, index) => (
          <div
            key={c.nome}
            className={`rounded-2xl bg-white/5 p-3 sm:p-4 flex flex-col gap-2.5 transition-[opacity,transform] duration-[800ms] ease-out ${
              stagger ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
            style={{ transitionDelay: stagger ? `${index * 120}ms` : '0ms' }}
          >
            <div className="font-cinzel text-base sm:text-lg font-bold text-[#e5e2e1]">{c.nome}</div>
            <ProductAnimatedScore
              score={c.score}
              play={stagger}
              size="sm"
              delayMs={stagger ? index * 100 : 0}
            />
            <CompatibilityBadge compatibilidade={c.compatibilidade} size="sm" />
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
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
              <span className="text-xs text-red-400">⚠ {c.bloqueios} bloqueio(s)</span>
            ) : (
              <span className="text-xs text-emerald-400">✓ Sem bloqueios</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Animated preview of the Nome Social result:
 * card enters → scores count up → crossfade to suggestion cards.
 */
export function ProductResultFrame() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const timersRef = useRef<number[]>([]);

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

    const runSequence = () => {
      clearTimers();

      if (prefersReducedMotion()) {
        setPhase('suggestions');
        return;
      }

      setPhase('harmony');
      schedule(() => setPhase('scores'), 700);
      // Hold the harmonization card long enough to read (~5.5s after scores start).
      schedule(() => setPhase('suggestions'), 7200);
      schedule(() => {
        setPhase('idle');
        schedule(runSequence, 600);
      }, 16000);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
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

  const harmonyVisible = phase === 'harmony' || phase === 'scores';
  // Keep final scores while the harmony panel fades out; reset only on loop idle.
  const scoresPlay = phase === 'scores' || phase === 'suggestions';
  const suggestionsVisible = phase === 'suggestions';

  return (
    <div
      ref={rootRef}
      className="rounded-2xl bg-[#131313] px-3 py-5 sm:px-5 sm:py-7 min-w-0 relative overflow-hidden"
    >
      <div className="relative grid min-w-0">
        <HarmonyPanel visible={harmonyVisible} scoresPlay={scoresPlay} />
        <SuggestionsPanel visible={suggestionsVisible} stagger={suggestionsVisible} />
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
