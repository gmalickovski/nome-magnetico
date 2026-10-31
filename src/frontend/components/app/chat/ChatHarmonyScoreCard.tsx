import React from 'react';
import type { ResultPanelData } from './chat-types.js';
import {
  HarmonyScoreDivider,
  HarmonyScoreRow,
  HarmonyScoreStack,
} from '../../landing/ProductResultFrame.js';

export interface ChatHarmonyScoreCardProps {
  birthPanel: ResultPanelData;
  harmonizedPanel?: ResultPanelData | null;
  className?: string;
}

/**
 * Painel lateral de scores — mesmo stack da landing (HarmonyScoreStack).
 */
export function ChatHarmonyScoreCard({
  birthPanel,
  harmonizedPanel,
  className = '',
}: ChatHarmonyScoreCardProps) {
  const dual = Boolean(harmonizedPanel);

  return (
    <HarmonyScoreStack className={className}>
      <HarmonyScoreRow
        eyebrow="Nome de nascimento (Nota Hoje)"
        nome={birthPanel.nome}
        score={birthPanel.score}
      />
      {dual && harmonizedPanel && (
        <>
          <HarmonyScoreDivider />
          <HarmonyScoreRow
            eyebrow="Nome harmonizado (Potencial)"
            nome={harmonizedPanel.nome}
            score={harmonizedPanel.score}
            eyebrowTone="harmonized"
          />
        </>
      )}
    </HarmonyScoreStack>
  );
}

export default ChatHarmonyScoreCard;
