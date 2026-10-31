import React, { useState } from 'react';
import type { CandidateSuggestion, ResultPanelData } from './chat-types.js';
import { SuggestionPicker } from './SuggestionPicker.js';
import { ChatSidebarSection } from './ChatSidebarSection.js';

export interface DemoChatScoresProps {
  birthPanel: ResultPanelData;
  suggestions: CandidateSuggestion[];
}

export default function DemoChatScores({ birthPanel, suggestions }: DemoChatScoresProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const active = suggestions.find((s) => s.id === selectedId);

  return (
    <div className="w-full max-w-[1680px] mx-auto grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,36%)] gap-6 xl:gap-8 text-[#e5e2e1] px-4">
      <SuggestionPicker
        suggestions={suggestions}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onRegenerate={() => undefined}
      />
      <ChatSidebarSection
        birthPanel={birthPanel}
        harmonizedPanel={active?.panel ?? null}
        showScoreCard
        showStarDetail
        starPanelData={active?.panel ?? birthPanel}
        isSuggestion={Boolean(selectedId)}
        onResetToBase={() => setSelectedId(null)}
        radarAxes={null}
        showRadar={false}
        summaryItems={[]}
        showSummary={false}
      />
    </div>
  );
}
