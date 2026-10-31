import React from 'react';
import type { ResultPanelData } from './chat-types.js';
import {
  HARMONY_STAR_VIEWBOX,
  HARMONY_STAR_CX,
  HARMONY_STAR_CY,
  HARMONY_STAR_OUTER_R,
  HARMONY_STAR_OUTER_INNER,
  HARMONY_STAR_INNER_R,
  HARMONY_STAR_INNER_INNER,
  HARMONY_STAR_LABEL_RADIUS,
  HARMONY_STAR_GOLD_NUM_RADIUS,
  HARMONY_STAR_RED_NUM_RADIUS,
  HARMONY_STAR_TIP_LABELS,
  HARMONY_STAR_LABEL_ANCHORS,
  HARMONY_STAR_LABEL_DX,
  HARMONY_STAR_LABEL_DY,
  harmonyStarPts,
  harmonyStarTipXY,
} from '../harmonizationStarGeometry.js';

export interface ResultFullscreenProps {
  isOpen: boolean;
  onClose: () => void;
  data: ResultPanelData;
  isSuggestion?: boolean;
}

export function ResultFullscreen({
  isOpen,
  onClose,
  data,
  isSuggestion = false,
}: ResultFullscreenProps) {
  if (!isOpen) return null;

  const outerPts = harmonyStarPts(
    HARMONY_STAR_CX,
    HARMONY_STAR_CY,
    HARMONY_STAR_OUTER_R,
    HARMONY_STAR_OUTER_INNER
  );

  const innerPts = harmonyStarPts(
    HARMONY_STAR_CX,
    HARMONY_STAR_CY,
    HARMONY_STAR_INNER_R,
    HARMONY_STAR_INNER_INNER
  );

  const numbers = [
    data.destino,
    data.expressao,
    data.motivacao,
    data.potencial,
    data.impressao,
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] bg-dark-deeper/95 backdrop-blur-xl overflow-y-auto flex flex-col p-4 sm:p-6 md:p-8 animate-fade-in"
    >
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <span className="text-xs font-cinzel uppercase tracking-widest text-gold">
            {isSuggestion ? 'Sugestão Harmonizada' : 'Nome de Nascimento'}
          </span>
          <h2 className="nm-h2 text-chat-ink">{data.nome}</h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar visualização ampliada"
          className="p-2.5 rounded-full bg-white/5 border border-white/10 text-chat-ink hover:bg-white/10 hover:border-gold/40 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="w-full max-w-4xl mx-auto py-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Estrela de Harmonização */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-chat-bubble/60 border border-white/5">
          <svg
            viewBox={`0 0 ${HARMONY_STAR_VIEWBOX.width} ${HARMONY_STAR_VIEWBOX.height}`}
            className="w-full max-w-[420px] h-auto overflow-visible"
          >
            {/* Estrela Dourada Externa */}
            <polygon
              points={outerPts}
              fill="rgba(212, 175, 55, 0.15)"
              stroke="#D4AF37"
              strokeWidth="2"
            />

            {isSuggestion && (
              <polygon
                points={innerPts}
                fill="rgba(192, 132, 252, 0.15)"
                stroke="#C084FC"
                strokeWidth="1.5"
              />
            )}

            {/* Labels e Números nas pontas */}
            {HARMONY_STAR_TIP_LABELS.map((label, i) => {
              const labelPos = harmonyStarTipXY(
                HARMONY_STAR_CX,
                HARMONY_STAR_CY,
                HARMONY_STAR_LABEL_RADIUS,
                i
              );
              const numPos = harmonyStarTipXY(
                HARMONY_STAR_CX,
                HARMONY_STAR_CY,
                HARMONY_STAR_GOLD_NUM_RADIUS,
                i
              );

              return (
                <g key={`tip-${i}`}>
                  <text
                    x={labelPos.x + HARMONY_STAR_LABEL_DX[i]}
                    y={labelPos.y + HARMONY_STAR_LABEL_DY[i]}
                    textAnchor={HARMONY_STAR_LABEL_ANCHORS[i] as any}
                    className="font-inter text-xs fill-chat-muted uppercase tracking-wider"
                  >
                    {label}
                  </text>
                  <text
                    x={numPos.x}
                    y={numPos.y + 4}
                    textAnchor="middle"
                    className="font-cinzel text-base font-bold fill-gold"
                  >
                    {numbers[i]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detalhes Numerológicos */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-chat-bubble/60 border border-white/5 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-chat-muted font-semibold">
                Pontuação Geral
              </span>
              <span className="text-2xl font-cinzel font-bold text-gold">
                {data.score}/100
              </span>
            </div>
            {data.compatibilidade && (
              <div className="text-xs text-brand-spiritual font-medium">
                Alinhamento: {data.compatibilidade}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-black/40 border border-white/5 p-3">
              <span className="text-[11px] uppercase tracking-wider text-chat-muted block">
                Expressão
              </span>
              <span className="text-lg font-cinzel font-bold text-chat-ink">
                {data.expressao}
              </span>
            </div>
            <div className="rounded-xl bg-black/40 border border-white/5 p-3">
              <span className="text-[11px] uppercase tracking-wider text-chat-muted block">
                Destino
              </span>
              <span className="text-lg font-cinzel font-bold text-chat-ink">
                {data.destino}
              </span>
            </div>
            <div className="rounded-xl bg-black/40 border border-white/5 p-3">
              <span className="text-[11px] uppercase tracking-wider text-chat-muted block">
                Motivação
              </span>
              <span className="text-lg font-cinzel font-bold text-chat-ink">
                {data.motivacao}
              </span>
            </div>
            <div className="rounded-xl bg-black/40 border border-white/5 p-3">
              <span className="text-[11px] uppercase tracking-wider text-chat-muted block">
                Impressão
              </span>
              <span className="text-lg font-cinzel font-bold text-chat-ink">
                {data.impressao}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-chat-bubble/60 border border-white/5 p-5">
            <h4 className="text-xs uppercase tracking-wider text-chat-muted font-semibold mb-3">
              Bloqueios no Nome ({data.bloqueiosCount})
            </h4>
            {data.bloqueiosCount === 0 ? (
              <p className="text-xs text-brand-success font-medium">
                Nenhum bloqueio ou sequência repetitiva detectada. Vibração limpa!
              </p>
            ) : (
              <ul className="space-y-2">
                {data.bloqueios.map((b, idx) => (
                  <li
                    key={`fs-block-${idx}-${b.codigo}`}
                    className="flex items-center gap-2 text-xs text-chat-ink"
                  >
                    <span className="font-mono text-gold font-bold px-1.5 py-0.5 rounded bg-gold/10">
                      {b.codigo}
                    </span>
                    <span>{b.titulo}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultFullscreen;
