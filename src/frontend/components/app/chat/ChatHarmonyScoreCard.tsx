import React from 'react';
import type { ResultPanelData } from './chat-types.js';
import { ChatScoreLandingRow } from './chat-score-landing-row.js';

export interface ChatHarmonyScoreCardProps {
  birthPanel: ResultPanelData;
  harmonizedPanel?: ResultPanelData | null;
  className?: string;
}

/**
 * Card lateral de scores — 1 barra (nome atual) ou 2 após escolher harmonização (estilo landing).
 */
export function ChatHarmonyScoreCard({
  birthPanel,
  harmonizedPanel,
  className = '',
}: ChatHarmonyScoreCardProps) {
  const dual = Boolean(harmonizedPanel);

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-chat-bubble/80 p-4 flex flex-col gap-4 transition-all duration-300 ${className}`}
    >
      <ChatScoreLandingRow
        eyebrow="Nome de nascimento (Nota hoje)"
        nome={birthPanel.nome}
        score={birthPanel.score}
      />

      {dual && harmonizedPanel && (
        <>
          <div className="border-t border-white/10" />
          <ChatScoreLandingRow
            eyebrow="Nome harmonizado (Potencial)"
            nome={harmonizedPanel.nome}
            score={harmonizedPanel.score}
          />
        </>
      )}
    </div>
  );
}

export default ChatHarmonyScoreCard;
