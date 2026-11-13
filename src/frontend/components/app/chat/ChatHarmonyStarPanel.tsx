import React from 'react';
import type { ResultPanelData } from './chat-types.js';
import {
  ProductHarmonyStar,
  harmonyStarNumsFromPanel,
} from '../../landing/ProductResultFrame.js';
import ReadingTopicCard from './ReadingTopicCard.js';

export interface ChatHarmonyStarPanelProps {
  birthPanel: ResultPanelData;
  harmonizedPanel?: ResultPanelData | null;
  isSuggestion: boolean;
  onResetToBase?: () => void;
  className?: string;
}

/** Estrela cabalística do painel lateral — mesmo componente da landing. */
export function ChatHarmonyStarPanel({
  birthPanel,
  harmonizedPanel = null,
  isSuggestion,
  onResetToBase,
  className = '',
}: ChatHarmonyStarPanelProps) {
  const dual = isSuggestion && Boolean(harmonizedPanel);

  return (
    <ReadingTopicCard
      eyebrow="Estrela Cabalística"
      subtitle="Os 5 números essenciais do seu campo vibracional"
      className={className}
    >
      {dual && harmonizedPanel ? (
        <ProductHarmonyStar
          play
          variant="dual"
          birthName={birthPanel.nome}
          birthScore={birthPanel.score}
          birthNums={harmonyStarNumsFromPanel(birthPanel)}
          harmonizedName={harmonizedPanel.nome}
          harmonizedScore={harmonizedPanel.score}
          harmonizedNums={harmonyStarNumsFromPanel(harmonizedPanel)}
        />
      ) : (
        <ProductHarmonyStar
          play
          variant="birth-only"
          birthName={birthPanel.nome}
          birthScore={birthPanel.score}
          birthNums={harmonyStarNumsFromPanel(birthPanel)}
        />
      )}
    </ReadingTopicCard>
  );
}

export default ChatHarmonyStarPanel;
