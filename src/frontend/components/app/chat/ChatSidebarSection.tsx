import React from 'react';
import type { RadarAxesData, ReadingSummaryItem, ResultPanelData } from './chat-types.js';
import { ResultPanel } from './ResultPanel.js';
import { ReadingRadar } from './ReadingRadar.js';
import { SummaryCard } from './SummaryCard.js';

export interface ChatSidebarSectionProps {
  panelData: ResultPanelData | null;
  /** false = sem nome cadastrado — não renderiza card da estrela nem placeholder. */
  showBirthStar?: boolean;
  isSuggestion: boolean;
  onResetToBase?: () => void;
  radarAxes: RadarAxesData | null;
  showRadar: boolean;
  summaryItems: ReadingSummaryItem[];
  showSummary: boolean;
  className?: string;
}

export function ChatSidebarSection({
  panelData,
  showBirthStar = true,
  isSuggestion,
  onResetToBase,
  radarAxes,
  showRadar,
  summaryItems,
  showSummary,
  className = '',
}: ChatSidebarSectionProps) {
  const hasPanel = showBirthStar && Boolean(panelData);

  if (!hasPanel && !showRadar && !showSummary) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {hasPanel && panelData && (
        <ResultPanel
          data={panelData}
          isSuggestion={isSuggestion}
          onResetToBase={onResetToBase}
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
