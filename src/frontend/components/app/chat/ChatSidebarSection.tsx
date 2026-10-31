import React from 'react';
import type { RadarAxesData, ReadingSummaryItem, ResultPanelData } from './chat-types.js';
import { ResultPanel } from './ResultPanel.js';
import { ReadingRadar } from './ReadingRadar.js';
import { SummaryCard } from './SummaryCard.js';
import { ChatHarmonyScoreCard } from './ChatHarmonyScoreCard.js';

export interface ChatSidebarSectionProps {
  birthPanel: ResultPanelData | null;
  harmonizedPanel?: ResultPanelData | null;
  showScoreCard: boolean;
  /** Estrela cabalística (após confirmação da certidão). */
  showStarDetail: boolean;
  starPanelData: ResultPanelData | null;
  isSuggestion: boolean;
  onResetToBase?: () => void;
  radarAxes: RadarAxesData | null;
  showRadar: boolean;
  summaryItems: ReadingSummaryItem[];
  showSummary: boolean;
  className?: string;
}

export function ChatSidebarSection({
  birthPanel,
  harmonizedPanel = null,
  showScoreCard,
  showStarDetail,
  starPanelData,
  isSuggestion,
  onResetToBase,
  radarAxes,
  showRadar,
  summaryItems,
  showSummary,
  className = '',
}: ChatSidebarSectionProps) {
  const hasScore = showScoreCard && Boolean(birthPanel);
  const hasStar = showStarDetail && Boolean(starPanelData);

  if (!hasScore && !hasStar && !showRadar && !showSummary) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {hasScore && birthPanel && (
        <ChatHarmonyScoreCard birthPanel={birthPanel} harmonizedPanel={harmonizedPanel} />
      )}

      {hasStar && starPanelData && (
        <ResultPanel
          data={starPanelData}
          isSuggestion={isSuggestion}
          onResetToBase={onResetToBase}
          hideScoreBar={hasScore}
        />
      )}

      {showRadar && radarAxes && (
        <div className="rounded-2xl border border-white/10 bg-chat-bubble/70 p-3 flex flex-col items-center">
          <span className="text-[11px] font-cinzel font-semibold uppercase tracking-wider text-chat-muted mb-1 self-start">
            Radar das Dimensões
          </span>
          <ReadingRadar axes={radarAxes} />
        </div>
      )}

      {showSummary && summaryItems.length > 0 && <SummaryCard items={summaryItems} />}
    </div>
  );
}

export default ChatSidebarSection;
