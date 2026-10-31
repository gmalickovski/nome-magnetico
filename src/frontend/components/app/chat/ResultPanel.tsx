import React, { useState } from 'react';
import type { ResultPanelData } from './chat-types.js';
import { ResultFullscreen } from './ResultFullscreen.js';
import {
  HARMONY_STAR_VIEWBOX,
  HARMONY_STAR_CX,
  HARMONY_STAR_CY,
  HARMONY_STAR_OUTER_R,
  HARMONY_STAR_OUTER_INNER,
  HARMONY_STAR_INNER_R,
  HARMONY_STAR_INNER_INNER,
  HARMONY_STAR_TIP_LABELS,
  harmonyStarPts,
} from '../harmonizationStarGeometry.js';

export interface ResultPanelProps {
  data: ResultPanelData;
  isSuggestion?: boolean;
  onResetToBase?: () => void;
  /** Oculta barras de pontuação (já exibidas no ChatHarmonyScoreCard). */
  hideScoreBar?: boolean;
  className?: string;
}

export function ResultPanel({
  data,
  isSuggestion = false,
  onResetToBase,
  hideScoreBar = false,
  className = '',
}: ResultPanelProps) {
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

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
    <>
      <div
        className={`rounded-2xl border border-white/10 bg-chat-bubble/80 p-4 transition-all duration-300 ${className}`}
      >
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="text-[11px] font-cinzel font-semibold uppercase tracking-wider text-gold">
                {isSuggestion ? 'Sugestão Ativa' : 'Nome de Nascimento'}
              </span>
            </div>
            <h3 className="nm-h4 text-sm font-cinzel text-chat-ink truncate max-w-[200px]" title={data.nome}>
              {data.nome}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            {isSuggestion && onResetToBase && (
              <button
                type="button"
                onClick={onResetToBase}
                title="Voltar ao nome de nascimento"
                aria-label="Voltar ao nome de nascimento"
                className="p-1.5 rounded-lg text-chat-muted hover:text-chat-ink hover:bg-white/5 transition text-xs"
              >
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={() => setFullscreenOpen(true)}
              title="Expandir visualização completa"
              aria-label="Expandir visualização completa"
              className="p-1.5 rounded-lg text-chat-muted hover:text-gold hover:bg-white/5 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l3.293 3.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-3.293 3.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l3.293-3.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-3.293-3.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Estrela compacta: só contorno(s); rótulos e números abaixo em lista */}
        <div className="w-full flex flex-col items-center py-1">
          <svg
            viewBox={`0 0 ${HARMONY_STAR_VIEWBOX.width} ${HARMONY_STAR_VIEWBOX.height}`}
            className="w-full max-w-[210px] h-auto overflow-visible"
            aria-label="Estrela cabalística do nome"
          >
            <polygon
              points={outerPts}
              fill="rgba(212, 175, 55, 0.12)"
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
          </svg>

          <ul className="mt-2 w-full space-y-1.5" aria-label="Números da estrela">
            {HARMONY_STAR_TIP_LABELS.map((label, i) => (
              <li
                key={`panel-star-row-${i}`}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="text-chat-muted">{label}</span>
                <span className="font-cinzel font-bold text-gold tabular-nums">{numbers[i]}</span>
              </li>
            ))}
          </ul>
        </div>

        {!hideScoreBar && (
          <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-chat-muted font-medium">Pontuação geral</span>
              <span className="font-cinzel font-bold text-gold text-sm">
                {data.score} / 100
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold to-brand-spiritual rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, data.score))}%` }}
              />
            </div>
          </div>
        )}

        {/* Bloqueios */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
          <span className="text-chat-muted">Bloqueios detectados:</span>
          {data.bloqueiosCount === 0 ? (
            <span className="text-brand-success font-semibold">Zero bloqueios</span>
          ) : (
            <span className="text-amber-400 font-semibold">
              {data.bloqueiosCount} {data.bloqueiosCount === 1 ? 'bloqueio' : 'bloqueios'}
            </span>
          )}
        </div>
      </div>

      <ResultFullscreen
        isOpen={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        data={data}
        isSuggestion={isSuggestion}
      />
    </>
  );
}

export default ResultPanel;
