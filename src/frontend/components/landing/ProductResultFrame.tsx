import React from 'react';
import ScoreDisplay from '../app/ScoreDisplay';
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

const GOLD = '#D4AF37';
const BIRTH_NAME = 'Maria da Silva Santos';
const INDICATED_NAME = 'MARIÃ SILVA';
const BIRTH_DATE = '26 de maio de 1971';
const DEMO_SCORE_BIRTH = 41;
const DEMO_SCORE_HARMONIZED = 83;

/** Demo values — outer (harmonizado) / inner (nascimento), same order as star tips. */
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

/**
 * Static preview of the Nome Social result (certificate + harmonization star).
 * Mirrors the live resultado layout; numbers and names are illustrative only.
 */
export function ProductResultFrame() {
  return (
    <div className="rounded-2xl bg-[#131313] px-3 py-5 sm:px-5 sm:py-7 min-w-0">
      <section className="rounded-2xl bg-white/5 p-4 sm:p-5 mb-5">
        <p className="font-cinzel text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#76746a] mb-4">
          Análise de Nome Social — Certificado Cabalístico
        </p>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-cinzel text-[10px] uppercase tracking-[0.14em] text-[#76746a] mb-1">
                Nome de nascimento
              </p>
              <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-[#e5e2e1] mb-1">
                {BIRTH_NAME}
              </h3>
              <p className="text-gray-500 text-xs mt-1">{BIRTH_DATE}</p>
            </div>
            <div className="w-full sm:w-44 shrink-0">
              <ScoreDisplay score={DEMO_SCORE_BIRTH} size="lg" />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pt-5 border-t border-white/10">
            <div className="min-w-0 flex-1">
              <p className="font-cinzel text-[10px] uppercase tracking-[0.14em] text-[#D4AF37]/70 mb-1">
                Nome harmonizado
              </p>
              <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-[#e5e2e1] mb-1">
                {INDICATED_NAME}
              </h3>
            </div>
            <div className="w-full sm:w-44 shrink-0">
              <ScoreDisplay score={DEMO_SCORE_HARMONIZED} size="lg" />
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

      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-8 mb-2 text-xs text-gray-400 px-0.5">
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

      <style>{`
        .harmony-star-wrap {
          display: flex;
          justify-content: center;
          width: 100%;
          padding-inline: 0.125rem;
        }
        .harmony-star-svg {
          max-width: 660px;
        }
        .harmony-star-label {
          fill: #b0b7c3;
          font-size: 15px;
        }
        .harmony-star-num-gold {
          font-size: 19px;
        }
        .harmony-star-num-red {
          font-size: 16px;
        }
        @media (max-width: 639px) {
          .harmony-star-wrap {
            transform: scale(1.05);
            transform-origin: center top;
          }
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
