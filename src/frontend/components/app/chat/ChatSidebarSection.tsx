import React from 'react';
import type {
  ChatReadingSummary,
  RadarAxesData,
  ReadingSummaryItem,
  ResultPanelData,
} from './chat-types.js';
import { ReadingRadar } from './ReadingRadar.js';
import { SummaryCard } from './SummaryCard.js';
import { ChatHarmonyScoreCard } from './ChatHarmonyScoreCard.js';
import { ChatHarmonyStarPanel } from './ChatHarmonyStarPanel.js';
import { ChatReadingSummaryPanel } from './ChatReadingSummaryPanel.js';

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
  radarOverlayAxes?: RadarAxesData | null;
  radarShowNumericLabels?: boolean;
  contextChips?: string[];
  showRadar: boolean;
  summaryItems: ReadingSummaryItem[];
  showSummary: boolean;
  readingSummary?: ChatReadingSummary | null;
  readingSummaryLoading?: boolean;
  showReadingSummary?: boolean;
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
  radarOverlayAxes = null,
  radarShowNumericLabels = false,
  contextChips = [],
  showRadar,
  summaryItems,
  showSummary,
  readingSummary = null,
  readingSummaryLoading = false,
  showReadingSummary = false,
  className = '',
}: ChatSidebarSectionProps) {
  const hasScore = showScoreCard && Boolean(birthPanel);
  const hasStar = showStarDetail && Boolean(starPanelData) && Boolean(birthPanel);
  const hasReadingBlocks =
    showReadingSummary && (Boolean(readingSummary) || readingSummaryLoading);

  if (!hasScore && !hasStar && !showRadar && !showSummary && !hasReadingBlocks) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {hasScore && birthPanel && (
        <ChatHarmonyScoreCard birthPanel={birthPanel} harmonizedPanel={harmonizedPanel} />
      )}

      {hasStar && birthPanel && (
        <ChatHarmonyStarPanel
          birthPanel={birthPanel}
          harmonizedPanel={isSuggestion ? harmonizedPanel : null}
          isSuggestion={isSuggestion}
          onResetToBase={onResetToBase}
        />
      )}

      {showRadar && radarAxes && (
        <div className="rounded-2xl border border-white/10 bg-chat-bubble/70 p-3 flex flex-col gap-3 w-full">
          <p className="nm-score-eyebrow self-start">Radar do motor</p>
          <ReadingRadar
            axes={radarAxes}
            overlayAxes={radarOverlayAxes}
            showNumericLabels={radarShowNumericLabels}
          />
          {contextChips.length > 0 && (
            <div className="w-full pt-1">
              <p className="text-[10px] uppercase tracking-wider text-chat-muted mb-2">Seu contexto</p>
              <div className="flex flex-wrap gap-1.5">
                {contextChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center rounded-full bg-[#1C1C1C] border border-[#D4AF37]/30 px-2.5 py-1 text-[11px] text-[#e5e2e1]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showSummary && summaryItems.length > 0 && <SummaryCard items={summaryItems} />}

      {hasReadingBlocks && (
        <ChatReadingSummaryPanel summary={readingSummary} loading={readingSummaryLoading} />
      )}
    </div>
  );
}

export default ChatSidebarSection;
