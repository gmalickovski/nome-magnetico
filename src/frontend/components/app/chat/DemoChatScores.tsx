import React, { useState } from 'react';
import type { CandidateSuggestion, ResultPanelData } from './chat-types.js';
import { SuggestionPicker } from './SuggestionPicker.js';
import { ChatSidebarSection } from './ChatSidebarSection.js';
import { ChatSidebarPanelChrome } from './ChatSidebarPanelChrome.js';
import { SummaryFab } from './SummaryFab.js';
import {
  MobileReadingBottomSheet,
  type ReadingSheetSnap,
} from './MobileReadingBottomSheet.js';
import { ChatProgress } from './ChatProgress.js';

export interface DemoChatScoresProps {
  birthPanel: ResultPanelData;
  suggestions: CandidateSuggestion[];
}

export default function DemoChatScores({ birthPanel, suggestions }: DemoChatScoresProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [readingSnap, setReadingSnap] = useState<ReadingSheetSnap>('closed');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const active = suggestions.find((s) => s.id === selectedId);

  const summaryCount = 3;

  const sidebar = (
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
    />
  );

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden text-[#e5e2e1]">
      <ChatProgress currentStep={4} totalSteps={7} className="shrink-0 border-b border-white/5" />

      <div
        className={`flex-1 min-h-0 w-full mx-auto grid min-h-0 ${
          sidebarExpanded
            ? 'md:grid-cols-1 px-3 sm:px-4 md:pr-1 lg:pr-1.5'
            : 'md:grid-cols-[minmax(0,1fr)_minmax(220px,44%)] lg:grid-cols-[minmax(0,1fr)_minmax(280px,38%)] xl:grid-cols-[minmax(0,1fr)_minmax(320px,34%)] gap-3 md:gap-4 lg:gap-6 px-3 sm:px-4 md:pl-5 lg:pl-6 md:pr-1 lg:pr-1.5'
        }`}
      >
        <main className={`flex flex-col min-h-0 min-w-0 py-3 ${sidebarExpanded ? 'hidden' : ''}`}>
          <div className="flex-1 min-h-0 chat-scroll-pane">
            <SuggestionPicker
              suggestions={suggestions}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRegenerate={() => undefined}
            />
          </div>
        </main>

        <aside
          className={`hidden md:flex flex-col min-h-0 py-3 w-full ${
            sidebarExpanded ? '' : ''
          }`}
        >
          <ChatSidebarPanelChrome
            expanded={sidebarExpanded}
            onToggleExpand={() => setSidebarExpanded((v) => !v)}
          >
            {sidebar}
          </ChatSidebarPanelChrome>
        </aside>
      </div>

      <SummaryFab visible count={summaryCount} onClick={() => setReadingSnap('half')} />

      <MobileReadingBottomSheet
        snap={readingSnap}
        onSnapChange={setReadingSnap}
        onClose={() => setReadingSnap('closed')}
        birthPanel={birthPanel}
        harmonizedPanel={active?.panel ?? null}
        showScoreCard
        showStarDetail
        starPanelData={active?.panel ?? birthPanel}
        isSuggestion={Boolean(selectedId)}
        onResetToBase={() => setSelectedId(null)}
        radarAxes={null}
        showRadar={false}
      />
    </div>
  );
}
