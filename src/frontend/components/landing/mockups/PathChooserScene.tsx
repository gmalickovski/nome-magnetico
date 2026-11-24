import { useEffect, useMemo } from 'react';
import {
  ChatOptionPills,
  ChatPanelHeader,
  ChatProgressBar,
  NmBubble,
  NmTypingBubble,
  ReadingTopicCard,
  UserBubble,
  type ChatOptionPillItem,
} from '../../shared/chat-ui/index.js';
import { ChatDesktopShell } from './ChatDesktopShell.js';
import { CHAT_SCRIPTS } from './chat-scripts.js';
import { DeviceFrame } from './DeviceFrame.js';
import { ScaledMockupCanvas } from './ScaledMockupCanvas.js';
import { MOCKUP_THEMES, type MockupDevice, type MockupTheme, type MockupThemeTokens } from './types.js';
import { useMockupTimeline, type TimelineStep } from './useMockupTimeline.js';
import './mockup-animations.css';

export type PathChooserAction =
  | 'ready'
  | 'focus'
  | 'tap'
  | 'selected'
  | 'f1_typing'
  | 'f1_shown'
  | 'f1_tap'
  | 'f1_answered'
  | 'f2_typing'
  | 'f2_shown'
  | 'f2_tap'
  | 'f2_answered'
  | 'f3_typing'
  | 'f3_shown'
  | 'f3_tap'
  | 'f3_answered'
  | 'f4_typing'
  | 'f4_shown'
  | 'f4_tap'
  | 'f4_answered'
  | 'f5_typing'
  | 'f5_shown'
  | 'f5_tap'
  | 'f5_answered';

/** Escolhe o caminho, segue 2 perguntas do caminho escolhido e reinicia no próximo caminho. */
const PATH_CHOOSER_STEPS: ReadonlyArray<TimelineStep<PathChooserAction>> = [
  { at: 0, action: 'ready' },
  { at: 550, action: 'focus' },
  { at: 1050, action: 'tap' },
  { at: 1550, action: 'selected' },
  { at: 2100, action: 'f1_typing' },
  { at: 2700, action: 'f1_shown' },
  { at: 3400, action: 'f1_tap' },
  { at: 4050, action: 'f1_answered' },
  { at: 4550, action: 'f2_typing' },
  { at: 5150, action: 'f2_shown' },
  { at: 5850, action: 'f2_tap' },
  { at: 6500, action: 'f2_answered' },
  { at: 7000, action: 'f3_typing' },
  { at: 7600, action: 'f3_shown' },
  { at: 8300, action: 'f3_tap' },
  { at: 8950, action: 'f3_answered' },
  { at: 9450, action: 'f4_typing' },
  { at: 10050, action: 'f4_shown' },
  { at: 10750, action: 'f4_tap' },
  { at: 11400, action: 'f4_answered' },
  { at: 11900, action: 'f5_typing' },
  { at: 12500, action: 'f5_shown' },
  { at: 13200, action: 'f5_tap' },
  { at: 13850, action: 'f5_answered' },
];

interface PathChoiceItem extends ChatOptionPillItem {
  theme: MockupTheme;
  description: string;
  previewTitle: string;
  previewBullets: string[];
}

const PATH_CHOICES: readonly PathChoiceItem[] = [
  {
    id: 'dia_a_dia',
    theme: 'social',
    label: 'Harmonizar o meu nome',
    description: 'Ajustar sua assinatura no dia a dia sem bloqueios.',
    previewTitle: 'Caminho · Nome Social',
    previewBullets: ['Triângulo da Vida cabalístico', 'Nota 0 a 100 + bloqueios', 'Sugestões com nota 80+'],
  },
  {
    id: 'artistico',
    theme: 'artistico',
    label: 'Criar um nome artístico',
    description: 'Para palco, redes sociais e marca pessoal.',
    previewTitle: 'Caminho · Nome Artístico',
    previewBullets: ['Afinidade número × área', 'Nomes próximos e novos', 'Presença de palco sem bloqueios'],
  },
  {
    id: 'bebe',
    theme: 'bebe',
    label: 'Escolher o nome do meu bebê',
    description: 'Cruza o sobrenome da família com a data prevista.',
    previewTitle: 'Caminho · Nome do Bebê',
    previewBullets: ['Janela possível do parto', 'Manual acolhedor para os pais', '0 bloqueios nos nomes indicados'],
  },
];

export interface PathChooserSceneProps {
  device?: MockupDevice;
  theme?: MockupTheme;
  srSummary?: string;
  forceReducedMotion?: boolean;
  showStatusPill?: boolean;
  className?: string;
}

function TapOverlay({ tokens }: { tokens: MockupThemeTokens }) {
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
 * Cena dos 3 botões de caminho ("O que você quer fazer hoje?") usando as peças compartilhadas
 * reais do chat (`NmBubble`, `ChatOptionPills`, `UserBubble`, `ReadingTopicCard`).
 */
export function PathChooserScene({
  device = 'phone',
  theme = 'social',
  srSummary,
  forceReducedMotion = false,
  showStatusPill = false,
  className = '',
}: PathChooserSceneProps) {
  const initialIndex = useMemo(() => {
    const found = PATH_CHOICES.findIndex((item) => item.theme === theme);
    return found >= 0 ? found : 0;
  }, [theme]);

  const timeline = useMockupTimeline<PathChooserAction>({
    steps: PATH_CHOOSER_STEPS,
    loopPauseMs: 1800,
    forceReducedMotion,
  });

  const activeIndex = timeline.reducedMotion
    ? initialIndex
    : (initialIndex + timeline.cycle) % PATH_CHOICES.length;

  const activeChoice = PATH_CHOICES[activeIndex]!;
  const activeTokens = MOCKUP_THEMES[activeChoice.theme];
  const action = timeline.currentAction ?? 'ready';
  const isTapping = !timeline.reducedMotion && action === 'tap';
  // 'selected' já aconteceu (acumulado), não só a ação atual: a escolha não pode voltar a aparecer.
  const isSelected = timeline.reducedMotion || timeline.triggeredActions.includes('selected');
  const showHighlight = action === 'focus' || isTapping || isSelected;

  // Perguntas do caminho escolhido (o caminho Social já usa a 1ª pergunta como escolha de caminho).
  const activeScript = CHAT_SCRIPTS[activeChoice.theme];
  const followUps =
    activeChoice.theme === 'social'
      ? [activeScript.exchanges[1], activeScript.exchanges[2], ...activeScript.more]
      : [...activeScript.exchanges, ...activeScript.more];
  const has = (a: PathChooserAction) => timeline.triggeredActions.includes(a);
  const chatStep = has('f2_answered') ? 3 : has('f1_answered') ? 2 : isSelected ? 1 : 0;

  // Começa no topo e acompanha a última mensagem quando o chat enche.
  useEffect(() => {
    const root = timeline.containerRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>('[data-path-chat]').forEach((el) => {
      el.scrollTo({ top: action === 'ready' ? 0 : el.scrollHeight });
    });
  }, [action, timeline.cycle, timeline.containerRef]);

  const renderFollowUp = (
    ex: (typeof followUps)[number],
    typingAction: PathChooserAction,
    shownAction: PathChooserAction,
    tapAction: PathChooserAction,
    answeredAction: PathChooserAction,
  ) => (
    <>
      {action === typingAction ? <NmTypingBubble /> : null}
      {has(shownAction) ? (
        <NmBubble eyebrow={ex.eyebrow} wide>
          <p className="text-chat-ink leading-relaxed">{ex.jevPrompt}</p>
          {!has(answeredAction) ? (
            <ChatOptionPills
              options={ex.chips}
              size="lg"
              selectedIds={action === tapAction ? [ex.chips[ex.selectedChipIndex]!.id] : []}
              className="mt-3"
              renderItemOverlay={(_, idx) =>
                action === tapAction && idx === ex.selectedChipIndex ? (
                  <TapOverlay tokens={activeTokens} />
                ) : null
              }
            />
          ) : null}
        </NmBubble>
      ) : null}
      {has(answeredAction) ? <UserBubble content={ex.userReply} /> : null}
    </>
  );

  const renderChatPane = (includeTopBar: boolean) => (
    <div className="flex flex-col flex-1 min-h-0 bg-[#131313]">
      {includeTopBar ? (
        <ChatProgressBar
          currentStep={chatStep}
          totalSteps={4}
          className="shrink-0 bg-dark-deeper/95 backdrop-blur-md border-b border-white/5"
        />
      ) : null}

      <div
        data-path-chat
        className="flex-1 min-h-0 flex flex-col justify-start gap-2 px-4 pb-4 pt-3 overflow-y-hidden"
      >
        <NmBubble eyebrow="PASSO 1 DE 3" wide>
          <p className="text-chat-ink leading-relaxed">O que você quer fazer hoje?</p>
          {!isSelected ? (
            <ChatOptionPills
              options={PATH_CHOICES}
              size="lg"
              selectedIds={showHighlight ? [activeChoice.id] : []}
              className="mt-3"
              renderItemOverlay={(opt) =>
                isTapping && opt.id === activeChoice.id ? <TapOverlay tokens={activeTokens} /> : null
              }
            />
          ) : null}
        </NmBubble>

        {isSelected ? <UserBubble content={activeChoice.label} /> : null}

        {followUps.map((ex, i) => {
          const n = i + 1;
          if (!timeline.triggeredActions.includes(`f${n}_typing` as PathChooserAction)) return null;
          return (
            <div key={`${activeChoice.theme}-f${n}`} className="contents">
              {renderFollowUp(
                ex,
                `f${n}_typing` as PathChooserAction,
                `f${n}_shown` as PathChooserAction,
                `f${n}_tap` as PathChooserAction,
                `f${n}_answered` as PathChooserAction,
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const phoneBody = (
    <ScaledMockupCanvas logicalWidth={375}>{renderChatPane(true)}</ScaledMockupCanvas>
  );

  const desktopBody = (
    <ChatDesktopShell stepIndex={chatStep} theme={activeChoice.theme} dual={false}>
      {renderChatPane(false)}
    </ChatDesktopShell>
  );

  return (
    <div
      ref={timeline.containerRef}
      data-mockup-scene="path-chooser"
      data-mockup-theme={activeChoice.theme}
      data-mockup-playing={timeline.isPlaying ? 'true' : 'false'}
      data-mockup-in-view={timeline.isInView ? 'true' : 'false'}
      data-mockup-reduced-motion={timeline.reducedMotion ? 'true' : 'false'}
      className={`relative w-full min-w-0 ${className}`}
    >
      {showStatusPill ? (
        <div className="mb-2 flex flex-wrap items-center justify-end gap-2 text-[11px] font-inter text-[#a0a0a0]">
          <span className="rounded-full bg-[#1C1C1C] px-2.5 py-0.5 ring-1 ring-white/[0.08]">
            {timeline.reducedMotion
              ? `Reduced motion · ${activeChoice.label}`
              : timeline.isPlaying
                ? `Ciclo ${timeline.cycle + 1} · ${activeChoice.label}`
                : 'Pausado fora da tela'}
          </span>
        </div>
      ) : null}

      <DeviceFrame
        variant={device}
        theme={activeChoice.theme}
        phoneContent={phoneBody}
        desktopContent={desktopBody}
        srSummary={
          srSummary ??
          'Prévia dos três caminhos disponíveis no chat: Harmonizar o meu nome, Criar um nome artístico e Escolher o nome do meu bebê.'
        }
      />
    </div>
  );
}

export default PathChooserScene;
