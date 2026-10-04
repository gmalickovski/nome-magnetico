import React from 'react';

const GOLD = '#D4AF37';
const GRAY = '#76746a';

const BIRTH_NAME = 'JOÃO ALBERTO DA SILVA';
const INDICATED_NAME = 'JOÃO ALBERTO SILVA';

const STAR_LABELS = ['Destino', 'Expressão', 'Motivação', 'Missão', 'Impressão'] as const;

function starPts(cx: number, cy: number, outerR: number, innerR: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a1 = ((-90 + i * 72) * Math.PI) / 180;
    pts.push(`${(cx + outerR * Math.cos(a1)).toFixed(1)},${(cy + outerR * Math.sin(a1)).toFixed(1)}`);
    const a2 = ((-90 + 36 + i * 72) * Math.PI) / 180;
    pts.push(`${(cx + innerR * Math.cos(a2)).toFixed(1)},${(cy + innerR * Math.sin(a2)).toFixed(1)}`);
  }
  return pts.join(' ');
}

function tipXY(cx: number, cy: number, r: number, i: number) {
  const a = ((-90 + i * 72) * Math.PI) / 180;
  return { x: +(cx + r * Math.cos(a)).toFixed(1), y: +(cy + r * Math.sin(a)).toFixed(1) };
}

const CX = 330;
const CY = 260;
const OUTER_PTS = starPts(CX, CY, 160, 62);
const INNER_PTS = starPts(CX, CY, 88, 34);
const LABEL_ANCHORS = ['middle', 'start', 'start', 'end', 'end'] as const;
const LABEL_DX = [0, 5, 5, -5, -5];
const LABEL_DY = [-5, 0, 8, 8, 0];

/**
 * Static first screen of the Nome Social result.
 * Uses the landing name pair already on the hero. No score ring and no invented numbers.
 */
export function ProductResultFrame() {
  return (
    <div className="rounded-2xl bg-[#131313] px-4 py-6 sm:px-6 sm:py-8 min-w-0">
      <p className="font-cinzel text-xs uppercase tracking-[0.15em] text-[#D4AF37]/70 mb-2">
        A Transformação
      </p>
      <h3 className="font-cinzel text-2xl font-bold text-[#e5e2e1]">A Harmonização</h3>

      <div className="flex justify-center mt-4 mb-4">
        <svg
          viewBox="0 0 660 520"
          className="w-full max-w-[28rem]"
          role="img"
          aria-label="Estrela da harmonização e estrela do nome de nascimento"
        >
          <polygon
            points={OUTER_PTS}
            fill={GOLD}
            fillOpacity="0.10"
            stroke={GOLD}
            strokeWidth="2"
          />
          <polygon
            points={INNER_PTS}
            fill={GRAY}
            fillOpacity="0.12"
            stroke={GRAY}
            strokeWidth="1.5"
          />
          {STAR_LABELS.map((label, i) => {
            const pos = tipXY(CX, CY, 210, i);
            return (
              <text
                key={label}
                x={pos.x + LABEL_DX[i]}
                y={pos.y + LABEL_DY[i]}
                fill={GRAY}
                fontSize="12"
                fontFamily="Inter, sans-serif"
                textAnchor={LABEL_ANCHORS[i]}
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-8 mb-6 text-xs text-gray-400">
        <span className="inline-flex items-center gap-2 min-w-0">
          <span
            className="inline-block w-3 h-3 rounded-full shrink-0"
            style={{ background: 'rgba(118,116,106,0.25)', outline: `1px solid ${GRAY}` }}
            aria-hidden="true"
          />
          <span className="truncate">{BIRTH_NAME}</span>
        </span>
        <span className="inline-flex items-center gap-2 min-w-0">
          <span
            className="inline-block w-3 h-3 rounded-full shrink-0"
            style={{ background: 'rgba(212,175,55,0.2)', outline: `1px solid ${GOLD}` }}
            aria-hidden="true"
          />
          <span className="truncate font-medium text-[#D4AF37]">{INDICATED_NAME}</span>
        </span>
      </div>

      <div className="rounded-2xl bg-white/[0.03] p-4 sm:p-6">
        <h4 className="font-cinzel text-base font-bold text-[#D4AF37] mb-3">O Escudo Magnético</h4>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          O nome de nascimento é o campo vibracional que você recebeu ao chegar nesta encarnação — sua
          semente de origem. Ele carrega padrões genuínos de força, mas também pode conter sequências
          de energia que criam resistência e ciclos difíceis de romper. Não é um defeito: é
          simplesmente o ponto de partida ainda sem o refinamento que apenas a intenção consciente
          pode trazer.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed">
          A Harmonização cria uma segunda camada — um escudo vibracional que se sobrepõe ao campo
          original sem apagá-lo.
        </p>
      </div>
    </div>
  );
}
