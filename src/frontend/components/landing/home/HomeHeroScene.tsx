import { useEffect, useMemo } from 'react';
import {
  ChatContextChips,
  ChatOptionPills,
  ChatPanelHeader,
  ChatProgressBar,
  ChatScorePanelCard,
  NmBubble,
  NmTypingBubble,
  ProductHarmonyStar,
  UserBubble,
  getScoreTierVisual,
  type ChatOptionPillItem,
} from '../../shared/chat-ui/index.js';
import { CHAT_SCRIPTS } from '../mockups/chat-scripts.js';
import { AnalysisPanelSheet } from '../mockups/AnalysisPanelMock.js';
import { ChatDesktopShell } from '../mockups/ChatDesktopShell.js';
import { DeviceFrame } from '../mockups/DeviceFrame.js';
import { RESULT_SCRIPTS } from '../mockups/result-scripts.js';
import { ScaledMockupCanvas } from '../mockups/ScaledMockupCanvas.js';
import { MOCKUP_THEMES, type MockupDevice, type MockupThemeTokens } from '../mockups/types.js';
import { useMockupTimeline } from '../mockups/useMockupTimeline.js';
import '../mockups/mockup-animations.css';
import { HOME_COPY } from './home-copy.js';
import { HOME_HERO_STEPS, type HomeHeroAction } from './home-hero-steps.js';

export interface HomeHeroSceneProps {
  device?: MockupDevice;
  srSummary?: string;
  forceReducedMotion?: boolean;
  className?: string;
}

function HeroTapOverlay({ tokens }: { tokens: MockupThemeTokens }) {
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

/**
 * Cena principal do Hero da Home (`DEV-338`):
 * escolha do caminho -> 2 perguntas -> 3 nomes sugeridos -> estrela comparativa (58 -> 93).
 */
export function HomeHeroScene({
  device = 'both',
  srSummary,
  forceReducedMotion = false,
  className = '',
}: HomeHeroSceneProps) {
  const script = CHAT_SCRIPTS.social;
  const result = RESULT_SCRIPTS.social;
  const tokens = MOCKUP_THEMES.social;

  const timeline = useMockupTimeline<HomeHeroAction>({
    steps: HOME_HERO_STEPS,
    loopPauseMs: 2000,
    forceReducedMotion,
  });

  const triggered = useMemo(
    () => new Set<HomeHeroAction>(timeline.triggeredActions),
    [timeline.triggeredActions],
  );

  const currentAction = timeline.currentAction ?? 'path_shown';
  const showStarFinale = triggered.has('star_finale');

  const convo = [
    { key: 'path', ex: script.exchanges[0] },
    { key: 'q1', ex: script.exchanges[1] },
    { key: 'q2', ex: script.exchanges[2] },
    { key: 'q3', ex: script.more[0] },
    { key: 'q4', ex: script.more[1] },
  ] as const;

  const stepIndex = showStarFinale
    ? 4
    : triggered.has('q4_answered')
      ? 3
      : triggered.has('q2_answered')
        ? 3
        : triggered.has('q1_answered')
          ? 2
          : triggered.has('path_answered')
            ? 1
            : 0;

  const harmVisual = getScoreTierVisual(result.harmonized.nota);

  const renderPills = (
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
          isTapping && idx === selectedIdx ? <HeroTapOverlay tokens={tokens} /> : null
        }
      />
    );
  };

  // Começa no topo e acompanha a última mensagem quando o chat enche (celular e desktop).
  useEffect(() => {
    const root = timeline.containerRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>('[data-hero-chat]').forEach((el) => {
      el.scrollTo({ top: currentAction === 'path_shown' ? 0 : el.scrollHeight });
    });
  }, [currentAction, timeline.containerRef]);

  const renderChatConversation = (_compact: boolean) => (
    <div
      data-hero-chat
      className="flex-1 min-h-0 flex flex-col justify-start gap-2 px-4 pb-4 pt-3 overflow-y-hidden"
    >
      {convo.map(({ key, ex }) => {
        const has = (suffix: string) => triggered.has(`${key}_${suffix}` as HomeHeroAction);
        const shown = key === 'path' ? has('shown') : has('typing');
        if (!shown) return null;
        return (
          <div key={key} className="contents">
            {key !== 'path' && currentAction === (`${key}_typing` as HomeHeroAction) ? (
              <NmTypingBubble />
            ) : null}
            {key === 'path' || has('shown') ? (
              <NmBubble eyebrow={ex.eyebrow} wide>
                <p className="text-chat-ink leading-relaxed">{ex.jevPrompt}</p>
                {!has('answered')
                  ? renderPills(ex.chips, ex.selectedChipIndex, currentAction === (`${key}_tap` as HomeHeroAction))
                  : null}
              </NmBubble>
            ) : null}
            {has('answered') ? <UserBubble content={ex.userReply} /> : null}
          </div>
        );
      })}

      {currentAction === 'wrap_typing' ? (
        <NmTypingBubble label="Sintonizando vibrações numéricas..." />
      ) : null}
    </div>
  );

  const phoneContent = (
    <ScaledMockupCanvas logicalWidth={375}>
      <div className="flex flex-col flex-1 min-h-0 bg-[#131313]">
        <ChatProgressBar
          currentStep={stepIndex}
          totalSteps={4}
          className="shrink-0 bg-dark-deeper/95 backdrop-blur-md border-b border-white/5"
        />
        <div className="relative flex-1 min-h-0 flex flex-col">
          {renderChatConversation(true)}
          {showStarFinale ? <AnalysisPanelSheet theme="social" /> : null}
        </div>
      </div>
    </ScaledMockupCanvas>
  );

  const desktopContent = (
    <ChatDesktopShell stepIndex={stepIndex} theme="social" dual={showStarFinale}>
      {renderChatConversation(false)}
    </ChatDesktopShell>
  );

  return (
    <div
      ref={timeline.containerRef}
      data-mockup-scene="home-hero"
      data-mockup-theme="social"
      data-mockup-playing={timeline.isPlaying ? 'true' : 'false'}
      data-mockup-in-view={timeline.isInView ? 'true' : 'false'}
      data-mockup-reduced-motion={timeline.reducedMotion ? 'true' : 'false'}
      className={`relative w-full min-w-0 ${className}`}
    >
      <DeviceFrame
        variant={device}
        theme="social"
        phoneContent={phoneContent}
        desktopContent={desktopContent}
        srSummary={srSummary ?? HOME_COPY.hero.heroSceneSummary}
      />
    </div>
  );
}

export default HomeHeroScene;
