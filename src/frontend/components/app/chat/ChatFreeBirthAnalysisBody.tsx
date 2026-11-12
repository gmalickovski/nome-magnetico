import React from 'react';
import type { ResultPanelData } from './chat-types.js';
import { ChatHarmonyStarPanel } from './ChatHarmonyStarPanel.js';
import { HarmonyScoreRow, HarmonyScoreStack } from '../../landing/ProductResultFrame.js';

export interface ChatFreeBirthAnalysisBodyProps {
  panel: ResultPanelData;
}

export function ChatFreeBirthAnalysisBody({ panel }: ChatFreeBirthAnalysisBodyProps) {
  return (
    <div className="flex flex-col gap-4 mt-2">
      <HarmonyScoreStack>
        <HarmonyScoreRow eyebrow="Nome de nascimento (Nota Hoje)" nome={panel.nome} score={panel.score} />
      </HarmonyScoreStack>

      <ChatHarmonyStarPanel birthPanel={panel} harmonizedPanel={null} isSuggestion={false} />
    </div>
  );
}

export default ChatFreeBirthAnalysisBody;
