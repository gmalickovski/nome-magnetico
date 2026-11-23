import { useMemo } from 'react';
import {
  ChatContextChips,
  ChatOptionPills,
  ChatPanelHeader,
  ChatProgressBar,
  ChatScorePanelCard,
  ChatSuggestionCard,
  NmBubble,
  NmTypingBubble,
  ProductHarmonyStar,
  UserBubble,
  getScoreTierVisual,
  type ChatOptionPillItem,
} from '../../shared/chat-ui/index.js';
import { CHAT_SCRIPTS } from '../mockups/chat-scripts.js';
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
  const showNames = triggered.has('names_shown');
  const showStarFinale = triggered.has('star_finale');

  const pathEx = script.exchanges[0];
  const q1Ex = script.exchanges[1];
  const q2Ex = script.exchanges[2];

  const stepIndex =
    showNames || showStarFinale
      ? 4
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

  const renderChatConversation = (compact: boolean) => {
    const condensePath = triggered.has('q2_typing') || showNames;
    const condenseQ1 = showNames;

    return (
      <div className="flex-1 min-h-0 flex flex-col justify-end gap-2 px-4 pb-4 pt-2 overflow-hidden">
        {!condensePath ? (
          <>
            {triggered.has('path_shown') ? (
              <NmBubble eyebrow={pathEx.eyebrow} wide>
                <p className="text-chat-ink leading-relaxed">{pathEx.jevPrompt}</p>
                {!triggered.has('path_answered')
                  ? renderPills(pathEx.chips, pathEx.selectedChipIndex, currentAction === 'path_tap')
                  : null}
              </NmBubble>
            ) : null}
            {triggered.has('path_answered') ? <UserBubble content={pathEx.userReply} /> : null}
          </>
        ) : null}

        {!condenseQ1 && triggered.has('q1_typing') ? (
          <>
            {currentAction === 'q1_typing' ? <NmTypingBubble /> : null}
            {triggered.has('q1_shown') ? (
              <NmBubble eyebrow={q1Ex.eyebrow} wide>
                <p className="text-chat-ink leading-relaxed">{q1Ex.jevPrompt}</p>
                {!triggered.has('q1_answered')
                  ? renderPills(q1Ex.chips, q1Ex.selectedChipIndex, currentAction === 'q1_tap')
                  : null}
              </NmBubble>
            ) : null}
            {triggered.has('q1_answered') ? <UserBubble content={q1Ex.userReply} /> : null}
          </>
        ) : null}

        {!showNames && triggered.has('q2_typing') ? (
          <>
            {currentAction === 'q2_typing' ? <NmTypingBubble /> : null}
            {triggered.has('q2_shown') ? (
              <NmBubble eyebrow={q2Ex.eyebrow} wide>
                <p className="text-chat-ink leading-relaxed">{q2Ex.jevPrompt}</p>
                {!triggered.has('q2_answered')
                  ? renderPills(q2Ex.chips, q2Ex.selectedChipIndex, currentAction === 'q2_tap')
                  : null}
              </NmBubble>
            ) : null}
            {triggered.has('q2_answered') ? <UserBubble content={q2Ex.userReply} /> : null}
          </>
        ) : null}

        {showNames ? (
          <div className="nm-mockup-enter">
            <NmBubble wide>
              <p className="text-chat-ink leading-relaxed">{script.jevClosingIntro}</p>
              <div
                className={`mt-3 rounded-2xl bg-[#161616] ${
                  compact ? 'p-3 space-y-2' : 'p-4 grid grid-cols-1 gap-2.5'
                }`}
              >
                {script.suggestions.map((item, idx) => (
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
            </NmBubble>
          </div>
        ) : null}
      </div>
    );
  };

  const renderStarFinalePane = (compact: boolean) => (
    <div
      className={`flex-1 min-h-0 flex flex-col justify-between bg-[#131313] ${
        compact ? 'p-4 gap-3' : 'p-5 gap-4 justify-center items-center'
      } nm-mockup-enter`}
    >
      {compact ? (
        <div className="flex items-center justify-between gap-2">
          <span className="font-cinzel text-xs font-bold uppercase tracking-[0.1em] text-[#e5e2e1]">
            Antes × Potencial
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${harmVisual.badgeClass}`}>
            {result.harmonized.nota}/100
          </span>
        </div>
      ) : null}

      <div className={compact ? 'w-full max-w-[296px] mx-auto' : 'nm-floating-card p-4 w-full max-w-[390px] mx-auto'}>
        <ProductHarmonyStar
          variant="dual"
          play
          birthName={result.birth.nome}
          birthScore={result.birth.nota}
          birthNums={[...result.birth.starNums]}
          harmonizedName={result.harmonized.nome}
          harmonizedScore={result.harmonized.nota}
          harmonizedNums={[...result.harmonized.starNums]}
        />
      </div>

      {compact ? (
        <ChatScorePanelCard
          birth={{ nome: result.birth.nome, score: result.birth.nota }}
          harmonized={{ nome: result.harmonized.nome, score: result.harmonized.nota }}
        />
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
        {showStarFinale ? renderStarFinalePane(true) : renderChatConversation(true)}
      </div>
    </ScaledMockupCanvas>
  );

  const topSuggestion = script.suggestions[0]!;
  const sidebarHarmonized =
    showNames || showStarFinale
      ? { nome: topSuggestion.card.nome, score: topSuggestion.card.score }
      : null;

  const desktopContent = (
    <ScaledMockupCanvas logicalWidth={1040}>
      <div className="flex flex-col flex-1 min-h-0 bg-[#131313]">
        <ChatProgressBar
          currentStep={stepIndex}
          totalSteps={4}
          className="shrink-0 bg-dark-deeper/95 backdrop-blur-md border-b border-white/5"
        />
        <div className="flex-1 min-h-0 grid grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] gap-3 px-4">
          <div className="flex flex-col min-h-0 min-w-0">
            {showStarFinale ? renderStarFinalePane(false) : renderChatConversation(false)}
          </div>

          <aside
            className={`flex flex-col justify-center gap-3 py-3 pl-3 pr-4 bg-[#131313]/95 min-h-0 overflow-hidden ${
              device === 'both' ? '!pr-52' : ''
            }`}
          >
            <ChatPanelHeader
              title={showStarFinale ? 'Estrela Comparativa' : 'Painel de Análise'}
              hasSelection={showNames || showStarFinale}
            />

            <ChatScorePanelCard
              birth={{ nome: result.birth.nome, score: result.birth.nota }}
              harmonized={sidebarHarmonized}
            />

            <div className="nm-floating-card p-4 space-y-2.5">
              <p className="text-xs font-inter text-[#a0a0a0] leading-relaxed">
                {showStarFinale
                  ? 'Comparação dos 5 números principais sem nenhum bloqueio nos 4 triângulos.'
                  : showNames
                    ? '3 sugestões selecionadas com nota acima de 80 e 0 bloqueios.'
                    : 'As opções aparecem ordenadas pela regra de qualidade ao responder.'}
              </p>
              <ChatContextChips
                chips={
                  showStarFinale
                    ? ['0 bloqueios', 'Nota 93/100', 'Expressão 6 × Destino 6']
                    : script.sidebarContextTags
                }
              />
            </div>
          </aside>
        </div>
      </div>
    </ScaledMockupCanvas>
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
