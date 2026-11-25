import React from 'react';
import { getScoreTierVisual } from './score-tier-visual.js';

export interface ScoreCardRowProps {
  /** Rótulo superior (ex.: "Nome de nascimento (Nota Hoje)"). Omitir ou vazio para ocultar. */
  eyebrow?: string;
  nome: string;
  score: number;
  /** @deprecated Tom não altera mais estilo — use `.nm-score-eyebrow` (dourado único). */
  eyebrowTone?: 'birth' | 'harmonized';
  /** Conteúdo extra ao lado do badge de nível (ex.: CompatibilityBadge). */
  scoreTrailing?: React.ReactNode;
  className?: string;
  /** Sobrescreve o número exibido (ex.: animação de contagem). */
  displayScore?: number;
  /** Aumenta proporcionalmente a fonte do nome e da nota para destacar o nome harmonizado principal. */
  emphasize?: boolean;
}

const SCORE_CARD_WIDE = '@[520px]/score-card';

/**
 * Linha de score responsiva por largura do card (@container/score-card).
 * Estreito: label → nome (1 linha) → nota+badge → barra.
 * Largo: label → (nome | nota+badge) → barra, sem quebra.
 */
export function ScoreCardRow({
  eyebrow,
  nome,
  score,
  scoreTrailing,
  className = '',
  displayScore,
  emphasize = false,
}: ScoreCardRowProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const shown = displayScore !== undefined ? Math.max(0, Math.min(100, Math.round(displayScore))) : clamped;
  const visual = getScoreTierVisual(shown);

  const showEyebrow = Boolean(eyebrow?.trim());
  const titleSizeClass = emphasize
    ? `nm-score-name--emphasized text-[1.35rem] sm:text-2xl ${SCORE_CARD_WIDE}:text-[1.55rem]`
    : `text-base sm:text-lg ${SCORE_CARD_WIDE}:text-xl`;
  const scoreSizeClass = emphasize ? 'text-[1.6875rem] sm:text-[1.75rem]' : 'text-xl';

  return (
    <div className={`@container/score-card w-full min-w-0 ${className}`}>
      <div className="flex flex-col gap-2.5 min-w-0 w-full">
        {showEyebrow && <p className="nm-score-eyebrow">{eyebrow}</p>}

        <div
          className={`flex flex-col gap-2 min-w-0 w-full ${SCORE_CARD_WIDE}:flex-row ${SCORE_CARD_WIDE}:items-center ${SCORE_CARD_WIDE}:justify-between ${SCORE_CARD_WIDE}:gap-3`}
        >
          <h4
            className={`min-w-0 w-full max-w-full font-cinzel font-bold text-white tracking-wide leading-snug truncate ${titleSizeClass} ${SCORE_CARD_WIDE}:flex-1`}
            title={nome}
          >
            {nome}
          </h4>

          <div
            className={`flex flex-wrap items-center gap-2 min-w-0 w-full ${SCORE_CARD_WIDE}:w-auto ${SCORE_CARD_WIDE}:shrink-0 ${SCORE_CARD_WIDE}:gap-2.5`}
          >
            <span
              className={`font-cinzel font-bold tabular-nums leading-none whitespace-nowrap ${scoreSizeClass}`}
              style={{ color: visual.text }}
            >
              {shown}
              <span className="text-xs font-inter font-normal text-gray-500 ml-0.5">/100</span>
            </span>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${visual.badgeClass} whitespace-nowrap`}
            >
              {visual.label}
            </span>
            {scoreTrailing}
          </div>
        </div>

        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full bg-gradient-to-r ${visual.barGradient} transition-all duration-500`}
            style={{ width: `${shown}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default ScoreCardRow;
