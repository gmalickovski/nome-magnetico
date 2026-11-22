import { useMemo } from 'react';
import {
  ChatBabyGoodDaysStrip,
  ChatContextChips,
  ChatOptionPills,
  ChatPanelHeader,
  ChatProgressBar,
  ChatScorePanelCard,
  ChatSuggestionCard,
  ChatSuggestionSectionHeader,
  NmBubble,
  NmTypingBubble,
  UserBubble,
  type ChatOptionPillItem,
} from '../../shared/chat-ui/index.js';
import { DeviceFrame } from './DeviceFrame.js';
import { ScaledMockupCanvas } from './ScaledMockupCanvas.js';
import { CHAT_SCRIPTS, type ChatScript } from './chat-scripts.js';
import { MOCKUP_THEMES, type MockupDevice, type MockupTheme, type MockupThemeTokens } from './types.js';
import { useMockupTimeline, type TimelineStep } from './useMockupTimeline.js';
import './mockup-animations.css';

export type ChatAction =
  | 'q1_typing'
  | 'q1_shown'
  | 'q1_tap'
  | 'q1_answered'
  | 'q2_typing'
  | 'q2_shown'
  | 'q2_tap'
  | 'q2_answered'
  | 'q3_typing'
  | 'q3_shown'
  | 'q3_tap'
  | 'q3_answered'
  | 'result_typing'
  | 'result_shown';

const CHAT_TIMELINE_STEPS: ReadonlyArray<TimelineStep<ChatAction>> = [
  { at: 0, action: 'q1_typing' },
  { at: 650, action: 'q1_shown' },
  { at: 1350, action: 'q1_tap' },
  { at: 2050, action: 'q1_answered' },
  { at: 2550, action: 'q2_typing' },
  { at: 3200, action: 'q2_shown' },
  { at: 3900, action: 'q2_tap' },
  { at: 4600, action: 'q2_answered' },
  { at: 5100, action: 'q3_typing' },
  { at: 5750, action: 'q3_shown' },
  { at: 6450, action: 'q3_tap' },
  { at: 7150, action: 'q3_answered' },
  { at: 7650, action: 'result_typing' },
  { at: 8450, action: 'result_shown' },
];

export interface ChatSceneProps {
  device?: MockupDevice;
  theme?: MockupTheme;
  script?: ChatScript;
  srSummary?: string;
  forceReducedMotion?: boolean;
  showStatusPill?: boolean;
  className?: string;
}

function FakeTapOverlay({ tokens }: { tokens: MockupThemeTokens }) {
  return (
    <span className="absolute left-1/2 top-1/2 pointer-events-none z-20" aria-hidden="true">
      <span
        className="block w-8 h-8 rounded-full nm-mockup-tap-ripple"
        style={{ border: `2px solid ${tokens.cursorCoreHex}` }}
      />
      <span
        className="block w-3.5 h-3.5 rounded-full nm-mockup-tap-core shadow-md"
        style={{
          backgroundColor: tokens.cursorCoreHex,
          boxShadow: `0 0 14px ${tokens.cursorRingRgba}`,
        }}
      />
    </span>
  );
}

function ChatConversationBody({
  script,
  tokens,
  triggered,
  currentAction,
  compact,
}: {
  script: ChatScript;
  tokens: MockupThemeTokens;
  triggered: Set<ChatAction>;
  currentAction: ChatAction | null;
  compact: boolean;
}) {
  const [ex1, ex2, ex3] = script.exchanges;
  const hasResult = triggered.has('result_shown');
  const hasQ3 = triggered.has('q3_typing');
  const hasQ2 = triggered.has('q2_typing');

  const condenseQ1 = hasQ3 || hasResult;
  const condenseQ2 = hasResult;
  const hideQ3PromptOnResult = hasResult;

  const renderStepPills = (
    chips: ChatOptionPillItem[],
    selectedIdx: number,
    isTapping: boolean,
  ) => {
    const selectedId = isTapping ? chips[selectedIdx]?.id : undefined;
    return (
      <ChatOptionPills
        options={chips}
        size="lg"
        selectedIds={selectedId ? [selectedId] : []}
        className="mt-3"
        renderItemOverlay={(_, idx) =>
          isTapping && idx === selectedIdx ? <FakeTapOverlay tokens={tokens} /> : null
        }
      />
    );
  };

  const renderResultContent = () => {
    const visibleSuggestions = compact ? script.suggestions.slice(0, 2) : script.suggestions.slice(0, 2);
    const artisticProximos = visibleSuggestions.filter((s) => s.secao === 'proximo');
    const artisticNovos = visibleSuggestions.filter((s) => s.secao === 'novo');
    const hasArtisticSections = artisticProximos.length > 0 || artisticNovos.length > 0;

    return (
      <div className="mt-3 space-y-3">
        {script.babyGoodDays && script.babyGoodDays.length > 0 ? (
          <ChatBabyGoodDaysStrip dias={script.babyGoodDays} />
        ) : null}

        {hasArtisticSections ? (
          <div className="rounded-2xl bg-[#161616] p-4 space-y-3.5">
            {artisticProximos.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                <ChatSuggestionSectionHeader
                  titulo="Nomes artísticos próximos do seu"
                  count={artisticProximos.length}
                />
                {artisticProximos.map((item, idx) => (
                  <ChatSuggestionCard
                    key={item.id}
                    card={item.card}
                    selected={idx === 0 && !artisticNovos.length}
                    principal={item.principal}
                    maiorNota={item.maiorNota}
                    destaque={item.destaque}
                    interactive={false}
                    delayIndex={idx}
                  />
                ))}
              </div>
            ) : null}

            {artisticNovos.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                <ChatSuggestionSectionHeader
                  titulo="Nomes totalmente novos"
                  count={artisticNovos.length}
                />
                {artisticNovos.map((item, idx) => (
                  <ChatSuggestionCard
                    key={item.id}
                    card={item.card}
                    selected={Boolean(item.principal)}
                    principal={item.principal}
                    maiorNota={item.maiorNota}
                    destaque={item.destaque}
                    interactive={false}
                    delayIndex={idx + artisticProximos.length}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#161616] p-4 space-y-3">
            {visibleSuggestions.map((item, idx) => (
              <ChatSuggestionCard
                key={item.id}
                card={item.card}
                selected={idx === 0}
                principal={item.principal}
                maiorNota={item.maiorNota}
                destaque={item.destaque}
                interactive={false}
                delayIndex={idx}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-end gap-2 px-4 pb-4 pt-2 overflow-hidden">
      {!condenseQ1 ? (
        <>
          {currentAction === 'q1_typing' ? <NmTypingBubble /> : null}
          {triggered.has('q1_shown') ? (
            <NmBubble eyebrow={ex1.eyebrow} wide>
              <p className="text-chat-ink leading-relaxed">{ex1.jevPrompt}</p>
              {!triggered.has('q1_answered')
                ? renderStepPills(ex1.chips, ex1.selectedChipIndex, currentAction === 'q1_tap')
                : null}
            </NmBubble>
          ) : null}
          {triggered.has('q1_answered') ? <UserBubble content={ex1.userReply} /> : null}
        </>
      ) : null}

      {!condenseQ2 && hasQ2 ? (
        <>
          {currentAction === 'q2_typing' ? <NmTypingBubble /> : null}
          {triggered.has('q2_shown') ? (
            <NmBubble eyebrow={ex2.eyebrow} wide>
              <p className="text-chat-ink leading-relaxed">{ex2.jevPrompt}</p>
              {!triggered.has('q2_answered')
                ? renderStepPills(ex2.chips, ex2.selectedChipIndex, currentAction === 'q2_tap')
                : null}
            </NmBubble>
          ) : null}
          {triggered.has('q2_answered') ? <UserBubble content={ex2.userReply} /> : null}
        </>
      ) : null}

      {hasQ3 ? (
        <>
          {currentAction === 'q3_typing' ? <NmTypingBubble /> : null}
          {triggered.has('q3_shown') && !hideQ3PromptOnResult ? (
            <NmBubble eyebrow={ex3.eyebrow} wide>
              <p className="text-chat-ink leading-relaxed">{ex3.jevPrompt}</p>
              {!triggered.has('q3_answered')
                ? renderStepPills(ex3.chips, ex3.selectedChipIndex, currentAction === 'q3_tap')
                : null}
            </NmBubble>
          ) : null}
          {triggered.has('q3_answered') ? <UserBubble content={ex3.userReply} /> : null}
        </>
      ) : null}

      {currentAction === 'result_typing' ? (
        <NmTypingBubble label="Sintonizando vibrações numéricas..." />
      ) : null}

      {hasResult ? (
        <NmBubble wide>
          <p className="text-chat-ink leading-relaxed">{script.jevClosingIntro}</p>
          {renderResultContent()}
        </NmBubble>
      ) : null}
    </div>
  );
}

function DesktopSidebar({
  script,
  hasResult,
  bothMode,
}: {
  script: ChatScript;
  hasResult: boolean;
  bothMode: boolean;
}) {
  const topSuggestion = script.suggestions.find((s) => s.principal) ?? script.suggestions[0]!;

  return (
    <aside
      className={`flex flex-col gap-3 py-3 px-5 bg-[#131313]/95 min-h-0 overflow-hidden ${
        bothMode ? 'pr-24' : ''
      }`}
    >
      <ChatPanelHeader hasSelection={hasResult} />

      <ChatScorePanelCard
        birth={{
          nome: script.birthExample.nome,
          score: script.birthExample.notaHoje,
        }}
        harmonized={
          hasResult
            ? {
                nome: topSuggestion.card.nome,
                score: topSuggestion.card.score,
              }
            : null
        }
      />

      <div className="nm-floating-card p-4 space-y-3">
        <p className="text-xs font-inter text-[#a0a0a0] leading-relaxed">
          {hasResult
            ? `${script.birthExample.bloqueiosLabel} · Comparado ao melhor nome sem bloqueios.`
            : 'O painel de análise acompanha sua conversa em tempo real.'}
        </p>
        <ChatContextChips chips={script.sidebarContextTags} />
      </div>
    </aside>
  );
}

/**
 * Simulação animada do chat usando exatamente os componentes visuais compartilhados
 * do produto real (`src/frontend/components/shared/chat-ui/`).
 */
export function ChatScene({
  device = 'both',
  theme = 'social',
  script,
  srSummary,
  forceReducedMotion = false,
  showStatusPill = false,
  className = '',
}: ChatSceneProps) {
  const activeScript = script ?? CHAT_SCRIPTS[theme];
  const tokens = MOCKUP_THEMES[activeScript.theme];

  const timeline = useMockupTimeline<ChatAction>({
    steps: CHAT_TIMELINE_STEPS,
    loopPauseMs: 1800,
    forceReducedMotion,
  });

  const triggered = useMemo(
    () => new Set<ChatAction>(timeline.triggeredActions),
    [timeline.triggeredActions],
  );

  const stepIndex = triggered.has('result_shown')
    ? 4
    : triggered.has('q3_answered')
      ? 3
      : triggered.has('q2_answered')
        ? 2
        : triggered.has('q1_answered')
          ? 1
          : 0;

  const phoneBody = (
    <ScaledMockupCanvas logicalWidth={375}>
      <div className="flex flex-col flex-1 min-h-0 bg-[#131313]">
        <ChatProgressBar
          currentStep={stepIndex}
          totalSteps={4}
          className="shrink-0 bg-dark-deeper/95 backdrop-blur-md border-b border-white/5"
        />
        <ChatConversationBody
          script={activeScript}
          tokens={tokens}
          triggered={triggered}
          currentAction={timeline.currentAction}
          compact
        />
      </div>
    </ScaledMockupCanvas>
  );

  const desktopBody = (
    <ScaledMockupCanvas logicalWidth={1180}>
      <div className="flex flex-col flex-1 min-h-0 bg-[#131313]">
        <ChatProgressBar
          currentStep={stepIndex}
          totalSteps={4}
          className="shrink-0 bg-dark-deeper/95 backdrop-blur-md border-b border-white/5"
        />
        <div className="flex-1 min-h-0 grid grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)] gap-4 px-5">
          <div className="flex flex-col min-h-0 min-w-0">
            <ChatConversationBody
              script={activeScript}
              tokens={tokens}
              triggered={triggered}
              currentAction={timeline.currentAction}
              compact={false}
            />
          </div>
          <DesktopSidebar
            script={activeScript}
            hasResult={triggered.has('result_shown')}
            bothMode={device === 'both'}
          />
        </div>
      </div>
    </ScaledMockupCanvas>
  );

  return (
    <div
      ref={timeline.containerRef}
      data-mockup-scene="chat"
      data-mockup-theme={activeScript.theme}
      data-mockup-playing={timeline.isPlaying ? 'true' : 'false'}
      data-mockup-in-view={timeline.isInView ? 'true' : 'false'}
      data-mockup-reduced-motion={timeline.reducedMotion ? 'true' : 'false'}
      className={`relative w-full min-w-0 ${className}`}
    >
      {showStatusPill ? (
        <div className="mb-2 flex flex-wrap items-center justify-end gap-2 text-[11px] font-inter text-[#a0a0a0]">
          <span className="rounded-full bg-[#1C1C1C] px-2.5 py-0.5 ring-1 ring-white/[0.08]">
            {timeline.reducedMotion
              ? 'Reduced motion · estado final'
              : timeline.isPlaying
                ? `Em tela · passo ${timeline.stepIndex + 1}/14`
                : 'Pausado fora da tela'}
          </span>
        </div>
      ) : null}

      <DeviceFrame
        variant={device}
        theme={activeScript.theme}
        phoneContent={phoneBody}
        desktopContent={desktopBody}
        srSummary={srSummary ?? activeScript.srSummary}
      />
    </div>
  );
}

export default ChatScene;
