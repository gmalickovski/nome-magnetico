import React from 'react';
import type { ResultPanelData } from './chat-types.js';
import {
  ProductHarmonyStar,
  harmonyStarNumsFromPanel,
} from '../../landing/ProductResultFrame.js';

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
    <div className={`w-full min-w-0 flex flex-col gap-3 ${className}`}>

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
    </div>
  );
}

export default ChatHarmonyStarPanel;
