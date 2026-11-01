import React from 'react';
import type { ReadingSummaryItem, ResultPanelData } from './chat-types.js';
import { ChatHarmonyStarPanel } from './ChatHarmonyStarPanel.js';
import { HarmonyScoreRow, HarmonyScoreStack } from '../../landing/ProductResultFrame.js';
import { SummaryCard } from './SummaryCard.js';

export interface ChatFreeBirthAnalysisBodyProps {
  panel: ResultPanelData;
  highlights: ReadingSummaryItem[];
}

export function ChatFreeBirthAnalysisBody({ panel, highlights }: ChatFreeBirthAnalysisBodyProps) {
  return (
    <div className="flex flex-col gap-4 mt-2">
      <HarmonyScoreStack>
        <HarmonyScoreRow eyebrow="Nome de nascimento (Nota Hoje)" nome={panel.nome} score={panel.score} />
      </HarmonyScoreStack>

      <ChatHarmonyStarPanel birthPanel={panel} harmonizedPanel={null} isSuggestion={false} />

      {highlights.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <SummaryCard items={highlights} />
        </div>
      )}
    </div>
  );
}

export default ChatFreeBirthAnalysisBody;
