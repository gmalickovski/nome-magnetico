import React, { useMemo } from 'react';
import { getScoreTierVisual } from '../score-tier-visual.js';
import { DeviceFrame } from './DeviceFrame.js';
import { CHAT_SCRIPTS, type ChatResultSuggestionExample, type ChatScript } from './chat-scripts.js';
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

function TypingBubble({
  tokens,
  label,
  compact = false,
}: {
  tokens: MockupThemeTokens;
  label?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col items-start w-full nm-mockup-enter">
      <div
        className={`rounded-2xl ${compact ? 'px-3 py-2' : 'px-3.5 py-2.5'} shadow-md inline-flex items-center gap-2`}
        style={{ backgroundColor: tokens.bubbleBgHex }}
      >
        <span className="inline-flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 rounded-full nm-mockup-dot-1"
            style={{ backgroundColor: tokens.accentHex }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full nm-mockup-dot-2"
            style={{ backgroundColor: tokens.accentHex }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full nm-mockup-dot-3"
            style={{ backgroundColor: tokens.accentHex }}
          />
        </span>
        {label ? <span className="text-[10.5px] font-inter text-[#a0a0a0]">{label}</span> : null}
      </div>
    </div>
  );
}

function MockNmBubble({
  eyebrow,
  tokens,
  compact = false,
  children,
}: {
  eyebrow?: string;
  tokens: MockupThemeTokens;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start w-full nm-mockup-enter">
      <div
        className={`rounded-2xl ${compact ? 'px-3 py-2 text-[11px]' : 'px-3.5 py-2.5 text-[12.5px]'} text-[#e5e2e1] font-inter leading-snug shadow-md max-w-[92%] ring-1 ring-white/[0.06]`}
        style={{ backgroundColor: tokens.bubbleBgHex }}
      >
        {eyebrow ? (
          <div
            className="font-cinzel text-[9px] font-bold tracking-[0.12em] uppercase mb-1"
            style={{ color: tokens.accentHex }}
          >
            {eyebrow}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function MockUserBubble({
  text,
  tokens,
  compact = false,
}: {
  text: string;
  tokens: MockupThemeTokens;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col items-end w-full nm-mockup-enter">
      <div
        className={`rounded-2xl ${compact ? 'px-3 py-1.5 text-[11px]' : 'px-3.5 py-2 text-[12.5px]'} font-inter font-semibold leading-snug shadow-md max-w-[84%]`}
        style={{
          backgroundColor: tokens.userBubbleBgHex,
          color: tokens.userBubbleTextHex,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function MockChipsRow({
  chips,
  selectedIndex,
  isTapping,
  isAnswered,
  tokens,
  compact = false,
}: {
  chips: string[];
  selectedIndex: number;
  isTapping: boolean;
  isAnswered: boolean;
  tokens: MockupThemeTokens;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap ${compact ? 'gap-1 mt-1.5' : 'gap-1.5 mt-2'} nm-mockup-enter`}>
      {chips.map((label, idx) => {
        const isTarget = idx === selectedIndex;
        const active = isTarget && (isTapping || isAnswered);
        return (
          <span key={label} className="relative inline-flex items-center">
            <span
              className={`inline-flex items-center rounded-full font-inter transition-all duration-300 ${
                compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'
              } ${active ? 'font-semibold scale-[0.98]' : 'text-[#e5e2e1]'}`}
              style={
                active
                  ? {
                      backgroundColor: tokens.selectedChipBgHex,
                      color: tokens.selectedChipTextHex,
                      border: `1px solid ${tokens.selectedChipBorderHex}`,
                    }
                  : {
                      backgroundColor: tokens.bubbleBgHex,
                      border: `1px solid ${tokens.chipBorderRgba}`,
                    }
              }
            >
              {label}
            </span>

            {isTarget && isTapping ? (
              <span
                className="absolute left-1/2 top-1/2 pointer-events-none z-20"
                aria-hidden="true"
              >
                <span
                  className="block w-7 h-7 rounded-full nm-mockup-tap-ripple"
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
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

function SuggestionResultCard({
  item,
  index,
  tokens,
  compact = false,
}: {
  item: ChatResultSuggestionExample;
  index: number;
  tokens: MockupThemeTokens;
  compact?: boolean;
}) {
  const tier = getScoreTierVisual(item.score);

  return (
    <div
      className={`nm-mockup-enter rounded-xl ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5'} bg-[#141414] ring-1 ring-white/[0.07]`}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0">
          {item.groupLabel ? (
            <div
              className="text-[8.5px] font-inter uppercase tracking-[0.08em] mb-0.5 leading-none"
              style={{ color: tokens.secondaryHex }}
            >
              {item.groupLabel}
            </div>
          ) : null}
          <div
            className={`font-cinzel font-bold text-[#e5e2e1] truncate ${compact ? 'text-[10.5px]' : 'text-[12.5px]'}`}
          >
            {item.nome}
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-inter font-bold tabular-nums ${compact ? 'text-[9.5px]' : 'text-[11px]'}`}
          style={{
            backgroundColor: tier.fill,
            color: tier.text,
            border: `1px solid ${tier.stroke}`,
          }}
        >
          {item.score}
        </span>
      </div>

      <div className="mt-0.5 flex items-center justify-between gap-1.5 text-[9px] font-inter text-[#a0a0a0]">
        <span className="truncate">
          Expr <strong className="text-[#e5e2e1]">{item.expressao}</strong> · Dest{' '}
          <strong style={{ color: tokens.accentHex }}>{item.destino}</strong>
        </span>
        <span className="text-emerald-400 font-medium shrink-0">✓ {item.badgeText}</span>
      </div>
    </div>
  );
}

function ChatChromeHeader({
  tokens,
  progress,
  compact = false,
}: {
  tokens: MockupThemeTokens;
  progress: number;
  compact?: boolean;
}) {
  const visual = getScoreTierVisual(Math.max(15, progress));

  return (
    <div
      className={`shrink-0 flex items-center justify-between gap-1.5 ${
        compact ? 'px-2.5 py-2' : 'px-4 py-2.5'
      } bg-[#161616]/90 backdrop-blur-md`}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <span
          className={`${compact ? 'h-4 w-4' : 'h-6 w-6'} rounded-full shrink-0`}
          style={{
            backgroundImage: tokens.orbGradient,
            boxShadow: `0 0 10px ${tokens.cursorRingRgba}`,
          }}
        />
        <div className="min-w-0">
          <div
            className={`font-cinzel font-bold text-[#e5e2e1] truncate ${compact ? 'text-[9.5px] tracking-tight' : 'text-xs'}`}
          >
            Nome Magnético
          </div>
          {!compact ? (
            <div className="text-[10px] font-inter text-[#a0a0a0] truncate">
              {tokens.headerSubtitle}
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`flex items-center ${compact ? 'gap-1.5 px-2 py-0.5' : 'gap-2 px-2.5 py-1'} rounded-full bg-[#111111] ring-1 ring-white/[0.06] shrink-0`}
      >
        <span
          className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-inter font-semibold tabular-nums`}
          style={{ color: visual.text }}
        >
          {progress}%
        </span>
        <div className={`${compact ? 'w-6 h-1' : 'w-14 h-1.5'} rounded-full bg-white/10 overflow-hidden`}>
          <div
            className={`h-full rounded-full bg-gradient-to-r ${visual.barGradient} transition-all duration-500`}
            style={{ width: `${Math.max(8, progress)}%` }}
          />
        </div>
      </div>
    </div>
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

  // Condensa trocas antigas para manter toda a conversa confortável dentro da moldura sem cortes.
  const condenseQ1 = (compact && hasQ3) || hasResult;
  const condenseQ2 = hasResult;
  const hideQ3PromptOnResult = hasResult;
  const showCondensedChips = (condenseQ1 || condenseQ2) && !(compact && hasResult);

  return (
    <div className={`flex-1 min-h-0 flex flex-col justify-end ${compact ? 'gap-1.5 p-2' : 'gap-2 p-3.5'}`}>
      {/* Resumo compacto dos passos iniciais quando o resultado aparece */}
      {showCondensedChips ? (
        <div className="flex flex-wrap gap-1 opacity-85">
          {condenseQ1 && triggered.has('q1_answered') ? (
            <span className="rounded-full bg-[#1C1C1C] px-2 py-0.5 text-[9.5px] font-inter text-[#a0a0a0] ring-1 ring-white/[0.06]">
              ✓ {ex1.userReply}
            </span>
          ) : null}
          {condenseQ2 && triggered.has('q2_answered') ? (
            <span className="rounded-full bg-[#1C1C1C] px-2 py-0.5 text-[9.5px] font-inter text-[#a0a0a0] ring-1 ring-white/[0.06]">
              ✓ {ex2.userReply}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Troca 1 */}
      {!condenseQ1 ? (
        <>
          {currentAction === 'q1_typing' ? <TypingBubble tokens={tokens} compact={compact} /> : null}
          {triggered.has('q1_shown') ? (
            <MockNmBubble eyebrow={ex1.eyebrow} tokens={tokens} compact={compact}>
              <p>{ex1.jevPrompt}</p>
              {!triggered.has('q1_answered') ? (
                <MockChipsRow
                  chips={ex1.chips}
                  selectedIndex={ex1.selectedChipIndex}
                  isTapping={currentAction === 'q1_tap'}
                  isAnswered={false}
                  tokens={tokens}
                  compact={compact}
                />
              ) : null}
            </MockNmBubble>
          ) : null}
          {triggered.has('q1_answered') ? (
            <MockUserBubble text={ex1.userReply} tokens={tokens} compact={compact} />
          ) : null}
        </>
      ) : null}

      {/* Troca 2 */}
      {!condenseQ2 && hasQ2 ? (
        <>
          {currentAction === 'q2_typing' ? <TypingBubble tokens={tokens} compact={compact} /> : null}
          {triggered.has('q2_shown') ? (
            <MockNmBubble eyebrow={ex2.eyebrow} tokens={tokens} compact={compact}>
              <p>{ex2.jevPrompt}</p>
              {!triggered.has('q2_answered') ? (
                <MockChipsRow
                  chips={ex2.chips}
                  selectedIndex={ex2.selectedChipIndex}
                  isTapping={currentAction === 'q2_tap'}
                  isAnswered={false}
                  tokens={tokens}
                  compact={compact}
                />
              ) : null}
            </MockNmBubble>
          ) : null}
          {triggered.has('q2_answered') ? (
            <MockUserBubble text={ex2.userReply} tokens={tokens} compact={compact} />
          ) : null}
        </>
      ) : null}

      {/* Troca 3 */}
      {hasQ3 ? (
        <>
          {currentAction === 'q3_typing' ? <TypingBubble tokens={tokens} compact={compact} /> : null}
          {triggered.has('q3_shown') && !hideQ3PromptOnResult ? (
            <MockNmBubble eyebrow={ex3.eyebrow} tokens={tokens} compact={compact}>
              <p>{ex3.jevPrompt}</p>
              {!triggered.has('q3_answered') ? (
                <MockChipsRow
                  chips={ex3.chips}
                  selectedIndex={ex3.selectedChipIndex}
                  isTapping={currentAction === 'q3_tap'}
                  isAnswered={false}
                  tokens={tokens}
                  compact={compact}
                />
              ) : null}
            </MockNmBubble>
          ) : null}
          {triggered.has('q3_answered') ? (
            <MockUserBubble text={ex3.userReply} tokens={tokens} compact={compact} />
          ) : null}
        </>
      ) : null}

      {/* Digitação final + Cards de nomes */}
      {currentAction === 'result_typing' ? (
        <TypingBubble tokens={tokens} label="Sintonizando mapa..." compact={compact} />
      ) : null}

      {hasResult ? (
        <MockNmBubble tokens={tokens} compact={compact}>
          <p className="mb-1.5">{script.jevClosingIntro}</p>
          <div className="flex flex-col gap-1.5">
            {script.suggestions.map((item, idx) => (
              <SuggestionResultCard
                key={item.nome}
                item={item}
                index={idx}
                tokens={tokens}
                compact={compact}
              />
            ))}
          </div>
        </MockNmBubble>
      ) : null}
    </div>
  );
}

function DesktopSidebar({
  script,
  tokens,
  hasResult,
  bothMode,
}: {
  script: ChatScript;
  tokens: MockupThemeTokens;
  hasResult: boolean;
  bothMode: boolean;
}) {
  const birthTier = getScoreTierVisual(script.birthExample.notaHoje);
  const topSuggestion = script.suggestions[0]!;
  const bestTier = getScoreTierVisual(topSuggestion.score);

  return (
    <aside
      className={`flex flex-col gap-2.5 p-3.5 bg-[#151515]/85 min-h-0 ${
        bothMode ? 'md:pr-16 lg:pr-20' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {hasResult ? (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: tokens.accentHex,
              boxShadow: `0 0 10px ${tokens.cursorRingRgba}`,
            }}
          />
        ) : null}
        <h3 className="font-cinzel text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#e5e2e1]">
          Painel de análise
        </h3>
      </div>

      {/* Card base / nascimento */}
      <div className="rounded-2xl bg-[#1C1C1C] p-3 ring-1 ring-white/[0.06]">
        <div className="text-[9.5px] font-inter uppercase tracking-[0.08em] text-[#a0a0a0]">
          Referência atual
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="font-cinzel text-xs font-bold text-[#e5e2e1] truncate">
            {script.birthExample.nome}
          </span>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-inter font-bold tabular-nums"
            style={{
              backgroundColor: birthTier.fill,
              color: birthTier.text,
              border: `1px solid ${birthTier.stroke}`,
            }}
          >
            {script.birthExample.notaHoje}
          </span>
        </div>
        <div className="mt-1 text-[10px] font-inter text-[#a0a0a0]">
          {script.birthExample.bloqueiosLabel}
        </div>
      </div>

      {/* Card harmonizado (entra ao final da conversa) */}
      {hasResult ? (
        <div className="nm-mockup-enter rounded-2xl bg-[#1C1C1C] p-3 ring-1 ring-white/[0.1]">
          <div
            className="text-[9.5px] font-inter uppercase tracking-[0.08em] font-semibold"
            style={{ color: tokens.accentHex }}
          >
            Destaque sem bloqueios
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="font-cinzel text-sm font-bold text-[#e5e2e1] truncate">
              {topSuggestion.nome}
            </span>
            <span
              className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-inter font-bold tabular-nums"
              style={{
                backgroundColor: bestTier.fill,
                color: bestTier.text,
                border: `1px solid ${bestTier.stroke}`,
              }}
            >
              {topSuggestion.score}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-inter">
            <span className="text-[#a0a0a0]">
              Expr {topSuggestion.expressao} · Dest {topSuggestion.destino}
            </span>
            <span className="text-emerald-400 font-medium">✓ {topSuggestion.badgeText}</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#181818] p-3 ring-1 ring-white/[0.04]">
          <div className="text-[10px] font-inter text-[#a0a0a0] leading-relaxed">
            O mapa completo atualiza conforme você responde ao Jev.
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
        {script.sidebarContextTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[#1C1C1C] px-2.5 py-1 text-[10px] font-inter text-[#e5e2e1]/80 ring-1 ring-white/[0.06]"
          >
            {tag}
          </span>
        ))}
      </div>
    </aside>
  );
}

/**
 * Simulação animada do chat do Jev com 3 roteiros de exemplo (social, artístico e bebê).
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

  const progress = triggered.has('result_shown')
    ? 100
    : triggered.has('q3_answered')
      ? 85
      : triggered.has('q2_answered')
        ? 58
        : triggered.has('q1_answered')
          ? 32
          : 12;

  const phoneBody = (
    <div className="flex flex-col flex-1 min-h-0">
      <ChatChromeHeader tokens={tokens} progress={progress} compact />
      <ChatConversationBody
        script={activeScript}
        tokens={tokens}
        triggered={triggered}
        currentAction={timeline.currentAction}
        compact
      />
    </div>
  );

  const desktopBody = (
    <div className="flex flex-col flex-1 min-h-0">
      <ChatChromeHeader tokens={tokens} progress={progress} />
      <div className="flex-1 min-h-0 grid grid-cols-[1.25fr_0.95fr] gap-px bg-white/[0.03]">
        <div className="flex flex-col min-h-0 min-w-0" style={{ backgroundColor: tokens.screenBgHex }}>
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
          tokens={tokens}
          hasResult={triggered.has('result_shown')}
          bothMode={device === 'both'}
        />
      </div>
    </div>
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
